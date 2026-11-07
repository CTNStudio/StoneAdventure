import {
  system,
} from "@minecraft/server";

import {
  getOrZero,
} from "./forge_utils.js";

const KEY_NEXT_APPLY = (id) => `stonecraft:next_apply_${id}`;
const KEY_MANAGED    = (id) => `stonecraft:managed_${id}`;
//最近一次施加效果时的「预计失效 tick」：效果提前消失说明是被外部清掉的（死亡、牛奶、图腾……），
//这种情况立即补回来；只有撑到预计失效才消失的，才按 CD / 占空比走。全程事件驱动，不做每 tick 覆盖。
const KEY_EXPECT_END = (id) => `stonecraft:expect_end_${id}`;

function now() {
  try { return system.currentTick; } catch { return Date.now(); }
}

//只有真存在属性时才写「清除」，否则每秒钟 7 条效果会白白各写一次
function hasProp(player, key) {
  try {
    return player.getDynamicProperty(key) !== undefined;
  } catch {
    return false;
  }
}
function clearProp(player, key) {
  if (!hasProp(player, key)) return;
  try { player.setDynamicProperty(key, undefined); } catch {}
}

function isManaged(player, id) {
  return getOrZero(player, KEY_MANAGED(id), 0) === 1;
}
function markManaged(player, id) {
  try { player.setDynamicProperty(KEY_MANAGED(id), 1); } catch {}
}
function unmarkManaged(player, id) {
  clearProp(player, KEY_MANAGED(id));
}

function getNextApply(player, id) {
  return getOrZero(player, KEY_NEXT_APPLY(id), 0);
}
function setNextApply(player, id, tick) {
  try { player.setDynamicProperty(KEY_NEXT_APPLY(id), tick); } catch {}
}
function clearNextApply(player, id) {
  clearProp(player, KEY_NEXT_APPLY(id));
}

function getExpectEnd(player, id) {
  return getOrZero(player, KEY_EXPECT_END(id), 0);
}
function setExpectEnd(player, id, tick) {
  if (!Number.isFinite(tick) || tick <= 0) {
    clearProp(player, KEY_EXPECT_END(id));
    return;
  }
  try { player.setDynamicProperty(KEY_EXPECT_END(id), tick); } catch {}
}
function clearExpectEnd(player, id) {
  clearProp(player, KEY_EXPECT_END(id));
}

//记录「我们施加的是哪一档」。外部（药水等）把它换成别的档位后，
//我们就不能再用 removeEffect 把它当自己的效果清掉。
const KEY_APPLIED_AMP = (id) => `stonecraft:applied_amp_${id}`;

function getAppliedAmp(player, id) {
  try {
    const value = player.getDynamicProperty(KEY_APPLIED_AMP(id));
    return typeof value === "number" ? value : undefined;
  } catch {
    return undefined;
  }
}
function setAppliedAmp(player, id, amplifier) {
  try { player.setDynamicProperty(KEY_APPLIED_AMP(id), amplifier); } catch {}
}
function clearAppliedAmp(player, id) {
  clearProp(player, KEY_APPLIED_AMP(id));
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
  speed: {
    id: "speed",
    effectId: "speed",
    playerKey: "stonecraft:speed",
    armorOnly: true,
    reapplyOnExpire: false,
    getRefreshInterval: (level) => 400 + 200 * level,
    getDuration:        (level) => 400 * level + 1 ,
    getAmplifier: (level) => Math.max(level - 1, 0),
  },
  //凝甲：本身不施加任何状态效果，登记在此只是为了让 player_attributes.js
  //把该属性按「护甲槽」统计（armorOnly 决定扫描哪些槽位）。实际回耐久见 special_effects/durability_effects.js
  coagulate_armor: {
    id: "coagulate_armor",
    effectId: "coagulate_armor",
    playerKey: "stonecraft:coagulate_armor",
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

//统一解析本次施加的持续时长（tick），0 表示该效果没有时长概念
function resolveDuration(cfg, level) {
  const duration = cfg.getDuration ? cfg.getDuration(level) : cfg.durationTicks;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function applyVanilla(player, cfg, level, amplifier) {
  player.addEffect(cfg.effectId, resolveDuration(cfg, level), {
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

//外部摘掉了本条效果后（例如迅突收回），清掉 CD / 归属，让定时系统立刻按装备等级重刷
export function resetTimedEffectCooldown(player, id) {
  if (!isPlayerValid(player)) return;
  clearNextApply(player, id);
  clearExpectEnd(player, id);
  unmarkManaged(player, id);
  clearAppliedAmp(player, id);
}

function getCurrentAmplifier(player, cfg) {
  try {
    const current = isCustom(cfg)
      ? (typeof cfg.getCurrent === "function" ? cfg.getCurrent(player) : undefined)
      : getVanillaCurrent(player, cfg);
    return current?.amplifier;
  } catch {
    return undefined;
  }
}

export function applyTimedSustainedEffects(player) {
  if (!isPlayerValid(player)) return;

  const tick = now();

  for (const cfg of Object.values(TIMED_EFFECT_CONFIG)) {
    const id    = cfg.id;
    const level = getOrZero(player, cfg.playerKey, 0);

    // 等级为 0：仅移除系统加的，且只移除「我们施加的那一档」
    if (level <= 0) {
      if (isManaged(player, id)) {
        const appliedAmp = getAppliedAmp(player, id);
        const currentAmp = getCurrentAmplifier(player, cfg);
        const stillOurs = appliedAmp === undefined
          || currentAmp === undefined
          || currentAmp === appliedAmp;
        if (stillOurs) {
          try {
            if (isCustom(cfg)) cfg.remove(player, 0);
            else removeVanilla(player, cfg, 0);
          } catch {}
        }
        unmarkManaged(player, id);
        clearAppliedAmp(player, id);
      }
      clearNextApply(player, id);
      clearExpectEnd(player, id);
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
      // 效果不存在分两种情况：
      //  · 撑到「预计失效 tick」才没有的 → 自然到期，继续按 CD / 占空比走
      //  · 没到期就没了（死亡、牛奶、不死图腾、其它模组清除）→ 立刻补回，不用等满一个 CD
      const expectEnd = getExpectEnd(player, id);
      const removedEarly = expectEnd > 0 && tick < expectEnd;
      if (removedEarly || reapplyOnExpire || tick >= nextApply) {
        needApply = true;
      }
    } else {
      //「所有权」判定：只有档位与我们上次施加的一致，才认为这个效果归我们管。
      //外部来源（药水、指令、其它模组）无论更强、更弱还是越界回绕都比对不上，
      //一律不覆盖、不接管；等它消失后由上面的「效果不存在」分支按装备等级接管。
      //用归属比对而不是大小比较，是为了不被 255 这类越界倍率（引擎里可能回绕成
      //负数或 0）误判成"比我们弱"而覆盖掉。
      const appliedAmp = getAppliedAmp(player, id);
      let owned = appliedAmp !== undefined && current.amplifier === appliedAmp;
      if (!owned && appliedAmp === undefined && isManaged(player, id)) {
        //旧存档迁移：标记是"我们施加的"但没有记录档位，认领当前档位
        setAppliedAmp(player, id, current.amplifier);
        owned = true;
      }

      if (!owned) {
        unmarkManaged(player, id);
        continue;
      }

      if (current.amplifier !== amplifier) {
        // 效果是我们的，但装备等级变了 → 立即重刷（无视 CD）
        needApply = true;
        mustRemove = true;
      } else if (tick >= nextApply) {
        // 效果仍在，CD到期则刷新
        needApply = true;
      }
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
      setAppliedAmp(player, id, amplifier);
      const refresh = cfg.getRefreshInterval
        ? cfg.getRefreshInterval(level)
        : cfg.refreshIntervalTicks;
      setNextApply(player, id, tick + refresh);

      const duration = resolveDuration(cfg, level);
      setExpectEnd(player, id, duration > 0 ? tick + duration : 0);
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
      clearExpectEnd(player, id);
      clearAppliedAmp(player, id);
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

export function initBulwark() {
  // 坚壁判定统一在 stone_heart_core.js 的 entityHurt 中完成，此处不再重复订阅
}