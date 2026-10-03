//武器特效：连锋（Combo）
//连续命中实体 → 伤害按百分比递增 → 挥空 / 5 秒无命中 / 换武器则重置。
//
//挥空判定仿照「积爆」的 10 tick 窗口算法：
//  · 记录上一次挥剑 tick 与上一次命中 tick
//  · 每次挥剑：若距上次挥剑已 ≥ 10 tick，检查「上一次挥剑之后有没有新的命中」
//      没有命中（lastHit < lastSwing）→ 上一刀挥空 → 立刻断连
//  · 命中事件（entityHitEntity）会把 lastHit 更新到命中时刻，从而兑现上一刀
//  · 不处理挥剑冷却：不做挥剑去抖/合并，10 tick 窗口本身就是判定基准
//这样连续挥剑每次都会独立判定，命中延迟、同一 tick 命中都不会误判。
//
//状态全部存放在玩家动态属性上，不使用内存 Map / NBT / 记分板。
import {
  system,
  world,
} from "@minecraft/server";

import {
  getMainHandItem,
  getOrZero,
} from "./forge_utils.js";

const COMBO_LEVEL_KEY = "stonecraft:combo_level";       //武器上的连锋等级
const COMBO_PLAYER_KEY = "stonecraft:combo";            //玩家身上的连锋等级缓存
const COMBO_COUNT_KEY = "stonecraft:combo_count";       //当前层数
const COMBO_LAST_HIT_KEY = "stonecraft:combo_last_hit"; //上次命中的 tick（命中事件更新）
const COMBO_LAST_SWING_KEY = "stonecraft:combo_last_swing"; //上次挥剑的 tick（Attack 挥臂更新）
const COMBO_PARTICLE_KEY = "stonecraft:combo_particle_hit"; //上次暴击粒子的 tick

//每层百分比加成：Lv1 +8% / Lv2 +10% / Lv3 +12%
//满层（10 层）分别提供 +72% / +90% / +108%
const COMBO_RATE_PER_LEVEL = {
  1: 0.08,
  2: 0.10,
  3: 0.12,
};

const COMBO_MAX_STACK = 10;          //层数上限（增幅上限）
const COMBO_HARD_LIMIT = 32767;
const COMBO_TIMEOUT_TICKS = 100;     //5 秒内无新命中则重置
const COMBO_SWING_WINDOW_TICKS = 10;
const COMBO_PARTICLE_STACK = 5;      //5 层开始出现暴击粒子
const COMBO_PARTICLE_COOLDOWN_TICKS = 10;

const TICK_NONE = -1000000;

//仅用于 afterEvent 粒子反馈：记录本次命中是否由连锋处理
const comboFrames = new Map();

function isPlayer(entity) {
  return !!entity && entity.typeId === "minecraft:player";
}

function getMainHandItemSafe(player) {
  try {
    return getMainHandItem(player);
  } catch {
    return undefined;
  }
}

function readProp(entity, key) {
  try {
    return entity?.getDynamicProperty?.(key);
  } catch {
    return undefined;
  }
}

function writeProp(entity, key, value) {
  try {
    entity.setDynamicProperty(key, value);
  } catch {}
}

function getTickProp(entity, key, fallback = TICK_NONE) {
  const value = readProp(entity, key);
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getCountProp(entity) {
  const value = readProp(entity, COMBO_COUNT_KEY);
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), COMBO_HARD_LIMIT);
}

function setCountProp(entity, count) {
  const safe = Number.isFinite(count)
    ? Math.max(0, Math.min(Math.floor(count), COMBO_HARD_LIMIT))
    : 0;
  if (safe > 0) {
    writeProp(entity, COMBO_COUNT_KEY, safe);
  } else {
    writeProp(entity, COMBO_COUNT_KEY, undefined);
  }
  return safe;
}

function getComboLevel(player) {
  const value = readProp(player, COMBO_PLAYER_KEY);
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), 3);
}

function getRate(level) {
  return COMBO_RATE_PER_LEVEL[level] ?? 0;
}

//把层数同步到武器物品上（换武器后每把武器保留各自的连锋层数）
function syncCountToItem(item, count) {
  if (!item) return;
  try {
    if (count > 0) {
      item.setDynamicProperty(COMBO_COUNT_KEY, Math.min(count, COMBO_HARD_LIMIT));
    } else {
      item.setDynamicProperty(COMBO_COUNT_KEY, undefined);
    }
  } catch {}
}

//重置连锋（层数为隐性机制，不产生任何 UI / Lore 反馈）
function resetCombo(player, reason) {
  const current = getCountProp(player);
  setCountProp(player, 0);
  syncCountToItem(getMainHandItemSafe(player), 0);
  writeProp(player, COMBO_LAST_HIT_KEY, undefined);
  writeProp(player, COMBO_LAST_SWING_KEY, undefined);

  return current > 0;
}

/**
 * beforeEvent 拦截伤害事件：
 * 读取当前连锋层数 → 按百分比重新计算伤害 → 返回修改后的伤害。
 * 递增后的伤害会写回 event.damage，因此会计入积爆等其他系统的积累。
 * 返回 number：释放的最终伤害。
 */
export function processComboDamage(attacker, target, eventDamage) {
  if (!isPlayer(attacker)) return eventDamage;
  if (!Number.isFinite(eventDamage) || eventDamage <= 0) return eventDamage;

  const item = getMainHandItemSafe(attacker);
  if (!item) return eventDamage;

  const level = getComboLevel(attacker) || Math.min(getOrZero(item, COMBO_LEVEL_KEY, 0), 3);
  if (level <= 0) return eventDamage;

  const tick = system.currentTick;

  //距离上次命中超过 5 秒则从 1 层重新开始
  const lastHitTick = getTickProp(attacker, COMBO_LAST_HIT_KEY);
  const timedOut = tick - lastHitTick > COMBO_TIMEOUT_TICKS;

  const previousCount = timedOut ? 0 : getCountProp(attacker);

  //起始为 1 层，之后每命中一次 +1，最多 10 层
  let count = previousCount <= 0 ? 1 : previousCount + 1;
  if (count > COMBO_MAX_STACK) count = COMBO_MAX_STACK;

  setCountProp(attacker, count);
  syncCountToItem(item, count);
  writeProp(attacker, COMBO_LAST_HIT_KEY, tick);

  comboFrames.set(attacker.id, { tick, count });

  const rate = getRate(level);
  const newDamage = rate > 0 ? eventDamage * (1 + rate * (count - 1)) : eventDamage;

  return Number.isFinite(newDamage) && newDamage > 0 ? newDamage : eventDamage;
}

//afterEvent：5 层起命中时生成暴击粒子，生成间隔与无敌帧一致（10 tick）
function handleComboHitEffects(attacker, target) {
  if (!isPlayer(attacker)) return;

  const frame = comboFrames.get(attacker.id);
  if (!frame || frame.tick !== system.currentTick) return;
  if (frame.count < COMBO_PARTICLE_STACK) return;

  const tick = system.currentTick;
  const lastParticleTick = getTickProp(attacker, COMBO_PARTICLE_KEY);
  if (tick - lastParticleTick < COMBO_PARTICLE_COOLDOWN_TICKS) return;

  writeProp(attacker, COMBO_PARTICLE_KEY, tick);

  try {
    const location = target.location;
    target.dimension.spawnParticle("minecraft:critical_hit_emitter", {
      x: location.x,
      y: location.y + 1.0,
      z: location.z,
    });
  } catch {}
}

//挥剑：积爆式 10 tick 结算
//swingSource 为 EntitySwingSource：Attack=攻击挥臂，其余来源（挖矿/放置/交互等）不计入
function isAttackSwing(swingSource) {
  if (swingSource === undefined || swingSource === null) return true;
  return String(swingSource) === "Attack";
}

function markSwing(player, itemStack, swingSource) {
  if (!isPlayer(player)) return;
  if (!isAttackSwing(swingSource)) return;

  const item = itemStack ?? getMainHandItemSafe(player);
  if (!item) return;

  const level = getComboLevel(player) || Math.min(getOrZero(item, COMBO_LEVEL_KEY, 0), 3);
  if (level <= 0) return;

  const tick = system.currentTick;
  const lastSwingTick = getTickProp(player, COMBO_LAST_SWING_KEY);
  const lastHitTick = getTickProp(player, COMBO_LAST_HIT_KEY);

  let verdict = "in_window";

  //距上次挥剑 ≥ 10 tick：结算上一刀
  if (lastSwingTick > TICK_NONE && tick - lastSwingTick >= COMBO_SWING_WINDOW_TICKS) {
    //上一刀挥出之后没有新的命中事件 → 挥空 → 断连
    if (lastHitTick < lastSwingTick) {
      verdict = "miss";
      resetCombo(player, "miss");
    } else {
      verdict = "hit";
    }
  }

  writeProp(player, COMBO_LAST_SWING_KEY, tick);
}

function tickComboStates() {
  const tick = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      const level = getComboLevel(player);

      //手上没有连锋武器：清掉残留层数
      if (level <= 0) {
        if (getCountProp(player) > 0) resetCombo(player, "no_weapon");
        continue;
      }

      //超时判定：5 秒内无任何命中 → 重置
      const lastHitTick = getTickProp(player, COMBO_LAST_HIT_KEY);
      if (lastHitTick > TICK_NONE && tick - lastHitTick > COMBO_TIMEOUT_TICKS) {
        if (resetCombo(player, "timeout")) continue;
      }

      //兜底：武器已被移除 / 卸下时清掉层数
      if (
        getCountProp(player) > 0 &&
        lastHitTick > TICK_NONE &&
        tick - lastHitTick > 40
      ) {
        const item = getMainHandItemSafe(player);
        if (!item || getOrZero(item, COMBO_LEVEL_KEY, 0) <= 0) {
          resetCombo(player, "weapon_gone");
        }
      }
    } catch (e) {
      console.warn("[Stonecraft] combo tick failed", e);
    }
  }

  //清理离场玩家的粒子反馈缓存
  if (comboFrames.size > 0) {
    const alive = new Set();
    for (const player of world.getAllPlayers()) alive.add(player.id);
    for (const id of [...comboFrames.keys()]) {
      if (!alive.has(id)) comboFrames.delete(id);
    }
  }
}

export function initComboEffects() {
  const beforeHurt = world.beforeEvents?.entityHurt;
  if (beforeHurt?.subscribe) {
    beforeHurt.subscribe((event) => {
      try {
        const target = event.hurtEntity;
        if (!target || target.typeId === "minecraft:player") return;

        const source = event.damageSource;
        if (!source?.damagingEntity) return;
        if (source.damagingEntity.typeId !== "minecraft:player") return;
        if (source.cause !== "entityAttack") return;

        const newDamage = processComboDamage(
          source.damagingEntity,
          target,
          event.damage
        );

        if (
          Number.isFinite(newDamage) &&
          newDamage > 0 &&
          newDamage !== event.damage
        ) {
          //连锋递增后的伤害直接释放，并计入积爆等其他系统的积累
          event.damage = newDamage;
        }
      } catch (e) {
        console.warn("[Stonecraft] combo beforeHurt failed", e);
      }
    });
  }

  const hitEvent = world.afterEvents?.entityHitEntity;
  if (hitEvent?.subscribe) {
    hitEvent.subscribe((event) => {
      try {
        const attacker = event.damagingEntity ?? event.damager ?? event.entity;
        const target = event.hitEntity ?? event.entityHitEntity;
        if (!attacker || attacker.typeId !== "minecraft:player") return;

        //命中信号：兑现上一次挥剑（无敌帧命中也算命中，只判定是否命中、不判定是否造成伤害）
        writeProp(attacker, COMBO_LAST_HIT_KEY, system.currentTick);

        const count = getCountProp(attacker);
        if (count > 0) {
          comboFrames.set(attacker.id, { tick: system.currentTick, count });
        }

        if (!target) return;
        handleComboHitEffects(attacker, target);
      } catch (e) {
        console.warn("[Stonecraft] combo entityHitEntity failed", e);
      }
    });
  }

  //左键攻击的挥臂事件：仅 Attack 来源计为挥剑
  const swingStart = world.afterEvents?.playerSwingStart;
  if (swingStart?.subscribe) {
    swingStart.subscribe((event) => {
      try {
        markSwing(event.player, event.heldItemStack, event.swingSource);
      } catch (e) {
        console.warn("[Stonecraft] combo playerSwingStart failed", e);
      }
    });
  } else {
    console.warn("[Stonecraft] combo: playerSwingStart unavailable, 挥空重置将无法生效");
  }

  const spawn = world.afterEvents?.playerSpawn;
  if (spawn?.subscribe) {
    spawn.subscribe((event) => {
      try {
        const player = event.player;
        if (!player) return;
        comboFrames.delete(player.id);
        setCountProp(player, 0);
        writeProp(player, COMBO_LAST_HIT_KEY, undefined);
        writeProp(player, COMBO_LAST_SWING_KEY, undefined);
        writeProp(player, COMBO_PARTICLE_KEY, undefined);
      } catch {}
    });
  }

  system.runInterval(tickComboStates, 2);
}
