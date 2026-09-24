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

// 特效配置表

// 每一项支持两种形态：

// A. 原版状态效果（不提供 apply/remove 时自动走原版）
//    { effectId, playerKey, getAmplifier, durationTicks, ... }
//
// B. 自定义函数
//    {
//      id,                  必填，唯一标识（用于动态属性 key）
//      playerKey,           必填，玩家动态属性名
//      armorOnly,           默认 true
//      refreshIntervalTicks,默认 60 * 20
//      durationTicks,       默认 120 * 20
//      getAmplifier,        (level) => number，可选
//      apply,               (player, level, amplifier) => void，必填
//      remove,              (player, level) => void，必填
//      getCurrent,          (player) => { amplifier } | undefined，可选
//    }

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
    refreshIntervalTicks: 60 * 20,
    durationTicks:        120 * 20,
    getAmplifier: () => 0,
  },
  fire_resistance: {
    id: "fire_resistance",
    effectId: "fire_resistance",
    playerKey: "stonecraft:fire_resistance",
    armorOnly: true,
    refreshIntervalTicks: 60 * 20,
    durationTicks:        120 * 20,
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
  player.addEffect(cfg.effectId, cfg.durationTicks, {
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

    if (!current) {
      needApply = true;
    } else if (current.amplifier !== amplifier) {
      needApply = true;
      mustRemove = true;
    } else if (tick >= getNextApply(player, id)) {
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
      setNextApply(player, id, tick + cfg.refreshIntervalTicks);
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