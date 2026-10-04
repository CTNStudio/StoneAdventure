import {
  system, world,
} from "@minecraft/server";

import {
  getOrZero,
} from "./forge_utils.js";

const KEY_NEXT_APPLY = (id) => `stonecraft:next_apply_${id}`;
const KEY_MANAGED    = (id) => `stonecraft:managed_${id}`;

function now() {
  try { return system.currentTick; } catch { return Date.now(); }
}

function isManaged(player, id) {
  return getOrZero(player, KEY_MANAGED(id), 0) === 1;
}
function markManaged(player, id) {
  try { player.setDynamicProperty(KEY_MANAGED(id), 1); } catch {}
}
function unmarkManaged(player, id) {
  try { player.setDynamicProperty(KEY_MANAGED(id), undefined); } catch {}
}

function getNextApply(player, id) {
  return getOrZero(player, KEY_NEXT_APPLY(id), 0);
}
function setNextApply(player, id, tick) {
  try { player.setDynamicProperty(KEY_NEXT_APPLY(id), tick); } catch {}
}
function clearNextApply(player, id) {
  try { player.setDynamicProperty(KEY_NEXT_APPLY(id), undefined); } catch {}
}

export function isPlayerValid(player) {
  try {
    return !!player && player.isValid();
  } catch {
    return !!player;
  }
}

export const TIMED_EFFECT_CONFIG = {
  resistance: {
    id: "resistance",
    effectId: "resistance",
    playerKey: "stonecraft:resistance",
    armorOnly: true,
    refreshIntervalTicks: 999999 * 20,
    durationTicks:        1000000 * 20,
    getAmplifier: (level) => Math.min(Math.floor(4.5 * (1 - Math.exp(-0.19 * level))), 4),
  },
  health_boost: {
    id: "health_boost",
    effectId: "health_boost",
    playerKey: "stonecraft:health_boost",
    armorOnly: true,
    refreshIntervalTicks: 999999 * 20,
    durationTicks:        1000000 * 20,
    getAmplifier: (level) => Math.max(level - 1, 0),
  },
  night_vision: {
    id: "night_vision",
    effectId: "night_vision",
    playerKey: "stonecraft:night_vision",
    armorOnly: true,
    reapplyOnExpire: false,
    getRefreshInterval: (level) => 400 + 200 * level,   // CD ticks
    getDuration:        (level) => 400 * level + 1 ,          // 持续时间 ticks
    getAmplifier: () => 0,
  },
  fire_resistance: {
    id: "fire_resistance",
    effectId: "fire_resistance",
    playerKey: "stonecraft:fire_resistance",
    armorOnly: true,
    reapplyOnExpire: false,
    getRefreshInterval: (level) => 400 + 200 * level,
    getDuration:        (level) => 400 * level + 1 ,
    getAmplifier: () => 0,
  },
  bulwark: {
    id: "bulwark",
    effectId: "bulwark",
    playerKey: "stonecraft:bulwark",
    armorOnly: true,
    refreshIntervalTicks: 999999 * 20,
    durationTicks: 0,
    getAmplifier: () => 0,
    apply: () => {},
    remove: () => {},
    getCurrent: () => ({ amplifier: 0 }),
  },
};

// 注册护甲自定义特效
export function registerArmorEffect(cfg) {
  if (!cfg || !cfg.id || !cfg.playerKey) {
    console.error("[Stonecraft] registerArmorEffect: id/playerKey required");
    return;
  }
  if (typeof cfg.apply !== "function" || typeof cfg.remove !== "function") {
    console.error("[Stonecraft] registerArmorEffect: apply/remove required for custom effect");
    return;
  }
  TIMED_EFFECT_CONFIG[cfg.id] = {
    armorOnly: true,
    refreshIntervalTicks: 60 * 20,
    durationTicks: 120 * 20,
    getAmplifier: () => 0,
    ...cfg,
  };
}

function isCustom(cfg) {
  return typeof cfg.apply === "function" && typeof cfg.remove === "function";
}

function applyVanilla(player, cfg, level, amplifier) {
  const duration = cfg.getDuration ? cfg.getDuration(level) : cfg.durationTicks;
  player.addEffect(cfg.effectId, duration, {
    amplifier,
    showParticles: false,
  });
}

function removeVanilla(player, cfg, _level) {
  try { player.removeEffect(cfg.effectId); } catch {}
}

function getVanillaCurrent(player, cfg) {
  try {
    const effect = player.getEffect(cfg.effectId);
    if (!effect) return undefined;
    return { amplifier: effect.amplifier, duration: effect.duration };
  } catch {
    return undefined;
  }
}

export function getTimedEffectIds() {
  return Object.values(TIMED_EFFECT_CONFIG).map((c) => c.id);
}

export function applyTimedSustainedEffects(player) {
  if (!isPlayerValid(player)) return;

  const tick = now();

  for (const cfg of Object.values(TIMED_EFFECT_CONFIG)) {
    const id    = cfg.id;
    const level = getOrZero(player, cfg.playerKey, 0);

    // 等级为 0：仅移除系统加的
    if (level <= 0) {
      if (isManaged(player, id)) {
        try {
          if (isCustom(cfg)) cfg.remove(player, 0);
          else removeVanilla(player, cfg, 0);
        } catch {}
        unmarkManaged(player, id);
      }
      clearNextApply(player, id);
      continue;
    }

    const amplifier = cfg.getAmplifier
      ? cfg.getAmplifier(level)
      : Math.max(level - 1, 0);

    let needApply = false;
    let mustRemove = false;

    const current = isCustom(cfg)
      ? (typeof cfg.getCurrent === "function" ? cfg.getCurrent(player) : undefined)
      : getVanillaCurrent(player, cfg);

        const nextApply = getNextApply(player, id);
    const reapplyOnExpire = cfg.reapplyOnExpire ?? true;

    if (!current) {
      // 效果不存在：根据配置决定是否无视 CD 立即重刷
      if (reapplyOnExpire || tick >= nextApply) {
        needApply = true;
      }
    } else if (current.amplifier !== amplifier) {
      // 等级变化时立即重刷（无视CD，保证换装即时生效）
      needApply = true;
      mustRemove = true;
    } else if (tick >= nextApply) {
      // 效果仍在，CD到期则刷新
      needApply = true;
    }

    if (!needApply) continue;

    try {
      if (mustRemove) {
        if (isCustom(cfg)) cfg.remove(player, level);
        else removeVanilla(player, cfg, level);
      }

      if (isCustom(cfg)) cfg.apply(player, level, amplifier);
      else applyVanilla(player, cfg, level, amplifier);

      markManaged(player, id);
      const refresh = cfg.getRefreshInterval
        ? cfg.getRefreshInterval(level)
        : cfg.refreshIntervalTicks;
      setNextApply(player, id, tick + refresh);
    } catch (e) {
      console.warn(`[Stonecraft] apply effect ${id} failed`, e);
    }
  }
}

export function clearTimedEffects(player) {
  for (const cfg of Object.values(TIMED_EFFECT_CONFIG)) {
    const id = cfg.id;
    try {
      if (isManaged(player, id)) {
        if (isCustom(cfg)) cfg.remove(player, 0);
        else removeVanilla(player, cfg, 0);
        unmarkManaged(player, id);
      }
      clearNextApply(player, id);
    } catch {}
  }
}

export function computeTimedDuration(cfg, _level) {
  return cfg.durationTicks ?? 0;
}
export function scheduleTimedRefresh(_player) {
}

export function tryBulwarkBlock(player, damage) { //坚壁
  if (!damage || damage <= 0) return false;

  const level = getOrZero(player, "stonecraft:bulwark", 0);
  if (level <= 0) return false;

  const chance = 5 + ((level - 1) * 45) / 11;
  return Math.random() * 100 < chance;
}

let bulwarkInitialized = false;

export function initBulwark() {
  if (bulwarkInitialized) return;
  bulwarkInitialized = true;

  world.beforeEvents.entityHurt.subscribe((event) => {
    try {
      const player = event.hurtEntity;
      if (!player || player.typeId !== "minecraft:player") return;

      const level = getOrZero(player, "stonecraft:bulwark", 0);
      if (level <= 0) return;

      const chance = 5 + ((level - 1) * 45) / 11;
      if (Math.random() * 100 < chance) {
        event.cancel = true;
      }
    } catch (error) {
      console.warn("[Stonecraft] bulwark hurt check failed", error);
    }
  });
}