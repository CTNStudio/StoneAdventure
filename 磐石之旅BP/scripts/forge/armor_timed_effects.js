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
    cooldownTicks: 60 * 20,
    baseDurationTicks: 9999999,
    durationPerLevelTicks: 0,
    armorOnly: true,
    getAmplifier: (level) => Math.min(Math.floor(4.5 * (1 - Math.exp(-0.19 * level))), 4),
  },
  health_boost: {
    effectId: "health_boost",
    playerKey: "stonecraft:health_boost",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 9999999,
    durationPerLevelTicks: 0,
    armorOnly: true,
    getAmplifier: (level) => Math.max(level - 1, 0),
  },
  night_vision: {
    effectId: "night_vision",
    playerKey: "stonecraft:night_vision",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 10 * 20,
    durationPerLevelTicks: 10 * 20,
    armorOnly: true,
    getAmplifier: (level) => 0,
  },
  fire_resistance: {
    effectId: "fire_resistance",
    playerKey: "stonecraft:fire_resistance",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 10 * 20,
    durationPerLevelTicks: 10 * 20,
    armorOnly: true,
    getAmplifier: (level) => 0,
  },
};

const CHECK_TIMERS = new Map();

function getNextApplyKey(effectId) {
  return `stonecraft:next_apply_${effectId}`;
}

function getManagedKey(effectId) {
  return `stonecraft:managed_${effectId}`;
}

function getCurrentTick() {
  try {
    return system.currentTick;
  } catch {
    return Date.now();
  }
}

function getNextApplyTime(player, effectId) {
  return getOrZero(player, getNextApplyKey(effectId), 0);
}

function setNextApplyTime(player, effectId, tick) {
  try {
    player.setDynamicProperty(getNextApplyKey(effectId), tick);
  } catch {}
}

function clearNextApplyTime(player, effectId) {
  try {
    player.setDynamicProperty(getNextApplyKey(effectId), undefined);
  } catch {}
}

function isManaged(player, config) {
  return getOrZero(player, getManagedKey(config.effectId), 0) === 1;
}

function markManaged(player, config) {
  try {
    player.setDynamicProperty(getManagedKey(config.effectId), 1);
  } catch {}
}

function unmarkManaged(player, config) {
  try {
    player.setDynamicProperty(getManagedKey(config.effectId), 0);
  } catch {}
}

// 取消特定效果的定时器
function cancelScheduledCheck(player, effectId) {
  const playerId = player.id;
  const key = `${playerId}:${effectId}`;
  const timer = CHECK_TIMERS.get(key);
  if (timer !== undefined) {
    try { system.clearRun(timer); } catch {}
    CHECK_TIMERS.delete(key);
  }
}

function scheduleCheck(player, config) {
  const effectId = config.effectId;
  const playerId = player.id;
  const key = `${playerId}:${effectId}`;

  // 取消旧定时器
  const oldTimer = CHECK_TIMERS.get(key);
  if (oldTimer !== undefined) {
    try { system.clearRun(oldTimer); } catch {}
    CHECK_TIMERS.delete(key);
  }

  // 检查等级
  const level = getOrZero(player, config.playerKey, 0);
  if (level <= 0) {
    // 等级为0，如果该效果由装备管理，则移除效果并取消管理
    if (isManaged(player, config)) {
      try { player.removeEffect(effectId); } catch {}
      unmarkManaged(player, config);
    }
    clearNextApplyTime(player, effectId);
    return;
  }

  // 计算下次检查时间
  const nextApply = getNextApplyTime(player, effectId);
  const now = getCurrentTick();
  let delay = Math.max(1, nextApply - now);
  if (nextApply <= 0) {
    // 如果没有设置下次应用时间，根据当前效果剩余时间设置
    const effect = player.getEffect(effectId);
    if (effect && effect.duration > 0) {
      const nextCheck = now + effect.duration + 1;
      setNextApplyTime(player, effectId, nextCheck);
      delay = effect.duration + 1;
    } else {
      // 没有效果，也没有冷却，不安排检查
      return;
    }
  }
  if (delay > 6000) delay = 6000; // 限制最大延迟

  const timer = system.runTimeout(() => {
    CHECK_TIMERS.delete(key);
    try {
      const level2 = getOrZero(player, config.playerKey, 0);
      if (level2 <= 0) {
        // 等级为0，如果由装备管理则移除
        if (isManaged(player, config)) {
          try { player.removeEffect(effectId); } catch {}
          unmarkManaged(player, config);
        }
        clearNextApplyTime(player, effectId);
        return;
      }

      const now2 = getCurrentTick();
      const next = getNextApplyTime(player, effectId);
      if (now2 < next) {
        scheduleCheck(player, config);
        return;
      }

      const effect = player.getEffect(effectId);
      const duration = computeTimedDuration(config, level2);
      const amplifier = config.getAmplifier ? config.getAmplifier(level2) : Math.max(level2 - 1, 0);

      if (!effect) {
        try {
          player.addEffect(effectId, duration, {
            amplifier,
            showParticles: false,
          });
          markManaged(player, config);
          const nextApplyTime = now2 + duration + config.cooldownTicks;
          setNextApplyTime(player, effectId, nextApplyTime);
        } catch (e) {
          console.warn(`[Stonecraft] reapply ${effectId} failed`, e);
        }
      } else {
        // 检查amplifier变化
        if (effect.amplifier !== amplifier) {
          try {
            player.removeEffect(effectId);
            player.addEffect(effectId, duration, {
              amplifier,
              showParticles: false,
            });
            markManaged(player, config);
            const nextApplyTime = now2 + duration + config.cooldownTicks;
            setNextApplyTime(player, effectId, nextApplyTime);
          } catch (e) {
            console.warn(`[Stonecraft] update ${effectId} failed`, e);
          }
        } else if (effect.duration < duration / 2) {
          // 刷新持续时间
          try {
            player.addEffect(effectId, duration, {
              amplifier,
              showParticles: false,
            });
            markManaged(player, config);
            const nextApplyTime = now2 + duration + config.cooldownTicks;
            setNextApplyTime(player, effectId, nextApplyTime);
          } catch (e) {
            console.warn(`[Stonecraft] refresh ${effectId} failed`, e);
          }
        }
        // 安排下一次检查
        if (getNextApplyTime(player, effectId) > 0) {
          scheduleCheck(player, config);
        } else {
          const remaining = effect.duration;
          if (remaining > 0) {
            const nextCheck = now2 + remaining + 1;
            setNextApplyTime(player, effectId, nextCheck);
            scheduleCheck(player, config);
          }
        }
      }
    } catch (e) {
      console.warn(`[Stonecraft] timed check for ${effectId} failed`, e);
    }
  }, delay);

  CHECK_TIMERS.set(key, timer);
}

export function getTimedEffectIds() {
  return Object.values(TIMED_EFFECT_CONFIG).map((c) => c.effectId);
}

export function computeTimedDuration(config, level) {
  const normalized = Math.max(0, Number(level) || 0);
  if (normalized <= 0) return 0;
  return Math.round(config.baseDurationTicks + normalized * config.durationPerLevelTicks);
}

export function isPlayerValid(player) {
  try {
    return !!player && player.isValid();
  } catch {
    return !!player;
  }
}

export function applyTimedSustainedEffects(player) {
  try {
    const now = getCurrentTick();
    for (const config of Object.values(TIMED_EFFECT_CONFIG)) {
      const effectId = config.effectId;
      const level = getOrZero(player, config.playerKey, 0);
      const nextApply = getNextApplyTime(player, effectId);

      // 取消可能存在的旧定时器（确保不会残留）
      cancelScheduledCheck(player, effectId);

      if (level <= 0) {
        // 等级为0：如果该效果由装备管理，则移除并取消管理
        if (isManaged(player, config)) {
          try { player.removeEffect(effectId); } catch {}
          unmarkManaged(player, config);
        }
        clearNextApplyTime(player, effectId);
        continue;
      }

      const duration = computeTimedDuration(config, level);
      const amplifier = config.getAmplifier ? config.getAmplifier(level) : Math.max(level - 1, 0);

      const effect = player.getEffect(effectId);

      if (!effect) {
        if (now >= nextApply) {
          try {
            player.addEffect(effectId, duration, {
              amplifier,
              showParticles: false,
            });
            markManaged(player, config);
            const nextApplyTime = now + duration + config.cooldownTicks;
            setNextApplyTime(player, effectId, nextApplyTime);
          } catch (e) {
            console.warn(`[Stonecraft] apply ${effectId} failed`, e);
          }
        }
        // 安排检查（无论是否施加成功，都要监控）
        scheduleCheck(player, config);
        continue;
      }

      // 效果存在，检查amplifier变化
      if (effect.amplifier !== amplifier) {
        try {
          player.removeEffect(effectId);
          player.addEffect(effectId, duration, {
            amplifier,
            showParticles: false,
          });
          markManaged(player, config);
          const nextApplyTime = now + duration + config.cooldownTicks;
          setNextApplyTime(player, effectId, nextApplyTime);
        } catch (e) {
          console.warn(`[Stonecraft] update ${effectId} failed`, e);
        }
        scheduleCheck(player, config);
        continue;
      }

      // amplifier 一致，检查是否需要刷新持续时间
      if (effect.duration < duration / 2) {
        try {
          player.addEffect(effectId, duration, {
            amplifier,
            showParticles: false,
          });
          markManaged(player, config);
          const nextApplyTime = now + duration + config.cooldownTicks;
          setNextApplyTime(player, effectId, nextApplyTime);
        } catch (e) {
          console.warn(`[Stonecraft] refresh ${effectId} failed`, e);
        }
        scheduleCheck(player, config);
      } else {
        // 确保有定时器监控后续变化
        if (nextApply > 0) {
          scheduleCheck(player, config);
        } else {
          const remaining = effect.duration;
          if (remaining > 0) {
            const nextCheck = now + remaining + 1;
            setNextApplyTime(player, effectId, nextCheck);
            scheduleCheck(player, config);
          }
        }
      }
    }
  } catch (error) {
    console.error("[Stonecraft] applyTimedSustainedEffects failed:", error);
  }
}

export function clearTimedEffects(player) {
  for (const config of Object.values(TIMED_EFFECT_CONFIG)) {
    try {
      cancelScheduledCheck(player, config.effectId);
      if (isManaged(player, config)) {
        player.removeEffect(config.effectId);
        unmarkManaged(player, config);
      }
      clearNextApplyTime(player, config.effectId);
    } catch {}
  }
}

export function scheduleTimedRefresh(player, config) {
  applyTimedSustainedEffects(player);
}