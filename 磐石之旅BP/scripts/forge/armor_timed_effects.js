import {
  system,
} from "@minecraft/server";

import {
  getOrZero,
} from "./forge_utils.js";

export const TIMED_EFFECT_CONFIG = {
  resistance: {
    effectId: "resistance",
    playerKey: "stonecraft:resistance",
    armorOnly: true,
    refreshIntervalTicks: 999999 * 20,
    durationTicks:        1000000 * 20,
    getAmplifier: (level) => Math.min(Math.floor(4.5 * (1 - Math.exp(-0.19 * level))), 4),
  },
  health_boost: {
    effectId: "health_boost",
    playerKey: "stonecraft:health_boost",
    armorOnly: true,
    refreshIntervalTicks: 999999 * 20,
    durationTicks:        1000000 * 20,
    getAmplifier: (level) => Math.max(level - 1, 0),
  },
  night_vision: {
    effectId: "night_vision",
    playerKey: "stonecraft:night_vision",
    armorOnly: true,
    refreshIntervalTicks: 60 * 20,
    durationTicks:        120 * 20,
    getAmplifier: () => 0,
  },
  fire_resistance: {
    effectId: "fire_resistance",
    playerKey: "stonecraft:fire_resistance",
    armorOnly: true,
    refreshIntervalTicks: 60 * 20,
    durationTicks:        120 * 20,
    getAmplifier: () => 0,
  },
};

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

export function getTimedEffectIds() {
  return Object.values(TIMED_EFFECT_CONFIG).map((c) => c.effectId);
}

export function isPlayerValid(player) {
  try {
    return !!player && player.isValid();
  } catch {
    return !!player;
  }
}

export function applyTimedSustainedEffects(player) {
  if (!isPlayerValid(player)) return;

  const tick = now();

  for (const cfg of Object.values(TIMED_EFFECT_CONFIG)) {
    const id    = cfg.effectId;
    const level = getOrZero(player, cfg.playerKey, 0);

    let effect;
    try { effect = player.getEffect(id); } catch { continue; }

    if (level <= 0) {
      // 只删"系统加的"
      if (effect && isManaged(player, id)) {
        try { player.removeEffect(id); } catch {}
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

    if (!effect) {
      // 没效果 → 施加
      needApply = true;
    } else if (effect.amplifier !== amplifier) {
      // amplifier 不一致 → 无条件更新（含降级）
      needApply = true;
      mustRemove = true;
    } else if (tick >= getNextApply(player, id)) {
      // amplifier 一致，到刷新时间 → 续期
      needApply = true;
    }

    if (!needApply) continue;

    // ============ 3) 施加 ============
    try {
      if (mustRemove) player.removeEffect(id);

      player.addEffect(id, cfg.durationTicks, {
        amplifier,
        showParticles: false,
      });

      markManaged(player, id);
      setNextApply(player, id, tick + cfg.refreshIntervalTicks);
    } catch (e) {
      console.warn(`[Stonecraft] apply ${id} failed`, e);
    }
  }
}

export function clearTimedEffects(player) {
  for (const cfg of Object.values(TIMED_EFFECT_CONFIG)) {
    const id = cfg.effectId;
    try {
      if (isManaged(player, id)) {
        player.removeEffect(id);
        unmarkManaged(player, id);
      }
      clearNextApply(player, id);
    } catch {}
  }
}

// 兼容旧接口
export function computeTimedDuration(cfg, _level) {
  return cfg.durationTicks ?? 0;
}
export function scheduleTimedRefresh(_player) {
}