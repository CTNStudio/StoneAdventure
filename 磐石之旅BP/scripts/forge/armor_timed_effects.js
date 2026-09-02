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

// 用于存储定时器句柄，key: playerId:effectId
const CHECK_TIMERS = new Map();

function getNextApplyKey(effectId) {
  return `stonecraft:next_apply_${effectId}`;
}

function getCurrentTick() {
  try {
    return system.currentTick;
  } catch {
    return Date.now(); // 降级方案
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

function scheduleCheck(player, config) {
  const effectId = config.effectId;
  const playerId = player.id;
  const key = `${playerId}:${effectId}`;

  // 取消已存在的定时器
  const oldTimer = CHECK_TIMERS.get(key);
  if (oldTimer !== undefined) {
    try { system.clearRun(oldTimer); } catch {}
    CHECK_TIMERS.delete(key);
  }

  // 计算下次检查时间：取 nextApplyTime 和当前 tick 的较大值，但至少延迟1 tick
  const nextApply = getNextApplyTime(player, effectId);
  const now = getCurrentTick();
  let delay = Math.max(1, nextApply - now);
  // 如果 nextApply 为0（未设置），则不安排检查（由属性更新触发）
  if (nextApply <= 0) return;

  // 限制最大延迟，避免长时间无调度（比如玩家离线）
  if (delay > 6000) delay = 6000; // 最多5分钟

  const timer = system.runTimeout(() => {
    CHECK_TIMERS.delete(key);
    try {
      // 检查是否应该重新施加
      const level = getOrZero(player, config.playerKey, 0);
      if (level <= 0) {
        clearNextApplyTime(player, effectId);
        return;
      }

      const now2 = getCurrentTick();
      const next = getNextApplyTime(player, effectId);
      if (now2 < next) {
        // 还没到冷却结束，重新安排检查
        scheduleCheck(player, config);
        return;
      }

      // 冷却结束，且等级>0，检查效果是否存在
      const effect = player.getEffect(effectId);
      if (!effect) {
        // 效果已消失，重新施加
        const duration = computeTimedDuration(config, level);
        const amplifier = config.getAmplifier ? config.getAmplifier(level) : Math.max(level - 1, 0);
        try {
          player.addEffect(effectId, duration, {
            amplifier,
            showParticles: false,
          });
          // 设置下一次冷却结束时间
          const nextApplyTime = now2 + duration + config.cooldownTicks;
          setNextApplyTime(player, effectId, nextApplyTime);
        } catch (e) {
          console.warn(`[Stonecraft] reapply ${effectId} failed`, e);
        }
      } else {
        const remaining = effect.duration;
        if (remaining > 0) {
          // 安排检查在剩余时间后
          const nextCheck = now2 + remaining + 1;
          setNextApplyTime(player, effectId, nextCheck);
          scheduleCheck(player, config);
        } else {
          // 剩余时间为0，说明马上就要消失，我们可以立即安排检查
          setNextApplyTime(player, effectId, now2 + 1);
          scheduleCheck(player, config);
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

      if (level <= 0) {
        // 等级为0，移除效果并清除冷却
        clearNextApplyTime(player, effectId);
        try { player.removeEffect(effectId); } catch {}
        continue;
      }

      const duration = computeTimedDuration(config, level);
      const amplifier = config.getAmplifier ? config.getAmplifier(level) : Math.max(level - 1, 0);

      // 检查效果是否存在
      const effect = player.getEffect(effectId);

      // 如果效果不存在，且冷却已过，则施加
      if (!effect) {
        if (now >= nextApply) {
          try {
            player.addEffect(effectId, duration, {
              amplifier,
              showParticles: false,
            });
            // 设置下一次冷却结束时间
            const nextApplyTime = now + duration + config.cooldownTicks;
            setNextApplyTime(player, effectId, nextApplyTime);
          } catch (e) {
            console.warn(`[Stonecraft] apply ${effectId} failed`, e);
          }
        }
        // 如果还在冷却中，不施加，但确保有定时器在冷却结束时检查
        scheduleCheck(player, config);
        continue;
      }

      // 效果存在，检查是否等级变化导致 amplifier 不同
      if (effect.amplifier !== amplifier) {
        try {
          player.removeEffect(effectId);
          player.addEffect(effectId, duration, {
            amplifier,
            showParticles: false,
          });
          // 重置冷却计时器
          const nextApplyTime = now + duration + config.cooldownTicks;
          setNextApplyTime(player, effectId, nextApplyTime);
        } catch (e) {
          console.warn(`[Stonecraft] update ${effectId} failed`, e);
        }
        scheduleCheck(player, config);
        continue;
      }
      if (nextApply > 0) {
        scheduleCheck(player, config);
      }
    }
  } catch (error) {
    console.error("[Stonecraft] applyTimedSustainedEffects failed:", error);
  }
}

export function clearTimedEffects(player) {
  for (const config of Object.values(TIMED_EFFECT_CONFIG)) {
    try {
      player.removeEffect(config.effectId);
      clearNextApplyTime(player, config.effectId);
    } catch {}
  }
}

export function scheduleTimedRefresh(player, config) {
  applyTimedSustainedEffects(player);
}