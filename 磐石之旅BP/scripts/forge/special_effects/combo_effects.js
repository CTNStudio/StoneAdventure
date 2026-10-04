import {
  system,
  world,
} from "@minecraft/server";

import {
  getMainHandItem,
  getOrZero,
} from "../forge_utils.js";

const COMBO_LEVEL_KEY = "stonecraft:combo_level";
const COMBO_PLAYER_KEY = "stonecraft:combo";
const COMBO_COUNT_KEY = "stonecraft:combo_count";
const COMBO_LAST_HIT_KEY = "stonecraft:combo_last_hit";
const COMBO_LAST_SWING_KEY = "stonecraft:combo_last_swing";
const COMBO_PARTICLE_KEY = "stonecraft:combo_particle_hit";

//每层百分比加成：Lv1 +8% / Lv2 +10% / Lv3 +12%
//满层（25 层）分别提供 +180% / +225% / +270%
const COMBO_RATE_PER_LEVEL = {
  1: 0.08,
  2: 0.10,
  3: 0.12,
};

const COMBO_MAX_STACK = 25;
const COMBO_HARD_LIMIT = 32767;
const COMBO_TIMEOUT_TICKS = 100;
const COMBO_SWING_WINDOW_TICKS = 10;
const COMBO_PARTICLE_STACK = 10;
const COMBO_PARTICLE_COOLDOWN_TICKS = 10;
const COMBO_QUEUE_LIMIT = 64;

const TICK_NONE = -1000000;

//仅用于 afterEvent 粒子反馈：记录本次命中是否由连锋处理
const comboFrames = new Map();

//playerId -> number[]，待结算的挥剑 tick 队列
const comboPendingSwings = new Map();

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

function getEffectiveComboLevel(player) {
  const cached = getComboLevel(player);
  if (cached > 0) return cached;
  const item = getMainHandItemSafe(player);
  if (!item) return 0;
  return Math.min(getOrZero(item, COMBO_LEVEL_KEY, 0), 3);
}

function getRate(level) {
  return COMBO_RATE_PER_LEVEL[level] ?? 0;
}

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

function resetCombo(player, reason) {
  const current = getCountProp(player);
  setCountProp(player, 0);
  syncCountToItem(getMainHandItemSafe(player), 0);
  writeProp(player, COMBO_LAST_HIT_KEY, undefined);
  writeProp(player, COMBO_LAST_SWING_KEY, undefined);

  return current > 0;
}

export function processComboDamage(attacker, target, eventDamage) {
  if (!isPlayer(attacker)) return eventDamage;
  if (!Number.isFinite(eventDamage) || eventDamage <= 0) return eventDamage;

  const item = getMainHandItemSafe(attacker);
  if (!item) return eventDamage;

  const level = getEffectiveComboLevel(attacker);
  if (level <= 0) return eventDamage;

  const tick = system.currentTick;

  const lastHitTick = getTickProp(attacker, COMBO_LAST_HIT_KEY);
  const timedOut = tick - lastHitTick > COMBO_TIMEOUT_TICKS;

  const previousCount = timedOut ? 0 : getCountProp(attacker);

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

  const level = getEffectiveComboLevel(player);
  if (level <= 0) return;

  const tick = system.currentTick;
  writeProp(player, COMBO_LAST_SWING_KEY, tick);

  let swings = comboPendingSwings.get(player.id);
  if (!swings) {
    swings = [];
    comboPendingSwings.set(player.id, swings);
  }
  swings.push(tick);

  if (swings.length > COMBO_QUEUE_LIMIT) {
    swings.splice(0, swings.length - COMBO_QUEUE_LIMIT);
  }
}

function tickPendingSwings() {
  if (comboPendingSwings.size === 0) return;

  const tick = system.currentTick;
  const players = world.getAllPlayers();
  const playerById = new Map();
  for (const p of players) playerById.set(p.id, p);

  for (const [playerId, swings] of comboPendingSwings) {
    const player = playerById.get(playerId);
    if (!player || !player.isValid) {
      comboPendingSwings.delete(playerId);
      continue;
    }

    const level = getEffectiveComboLevel(player);
    if (level <= 0) {
      comboPendingSwings.delete(playerId);
      continue;
    }

    while (swings.length > 0 && tick - swings[0] >= COMBO_SWING_WINDOW_TICKS) {
      const swingTick = swings.shift();
      const lastHitTick = getTickProp(player, COMBO_LAST_HIT_KEY);

      if (lastHitTick < swingTick) {
        resetCombo(player, "miss");
        swings.length = 0;
        break;
      }
    }

    if (swings.length === 0) {
      comboPendingSwings.delete(playerId);
    }
  }
}

function tickComboStates() {
  const tick = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      const level = getEffectiveComboLevel(player);

      if (level <= 0) {
        if (getCountProp(player) > 0) resetCombo(player, "no_weapon");
        continue;
      }

      const lastHitTick = getTickProp(player, COMBO_LAST_HIT_KEY);
      if (lastHitTick > TICK_NONE && tick - lastHitTick > COMBO_TIMEOUT_TICKS) {
        if (resetCombo(player, "timeout")) continue;
      }

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
        const attacker = event.damagingEntity;
        const target = event.hitEntity;
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
        comboPendingSwings.delete(player.id);
        setCountProp(player, 0);
        writeProp(player, COMBO_LAST_HIT_KEY, undefined);
        writeProp(player, COMBO_LAST_SWING_KEY, undefined);
        writeProp(player, COMBO_PARTICLE_KEY, undefined);
      } catch {}
    });
  }

  system.runInterval(tickComboStates, 2);
  system.runInterval(tickPendingSwings, 1);
}