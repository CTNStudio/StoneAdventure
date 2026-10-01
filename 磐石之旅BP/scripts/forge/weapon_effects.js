//武器，护甲攻击特效模块
//在玩家攻击实体时，根据玩家动态属性中缓存的总属性等级，向目标施加对应的状态效果。
import {
  system,
  world,
} from "@minecraft/server";

import {
  ATTRIBUTE_DEFS,
  getAttributeLevel,
  getMainHandItem,
  getOrZero,
} from "./forge_utils.js";

import {
  clearEffect,
} from "../food.js";

const EFFECT_HANDLERS = {
  wither: (attacker, target, level) => {
    target.addEffect("wither", 60 + level * 30, {
      amplifier: Math.min(level - 1, 4),
      showParticles: false,
    });
  },
  blindness: (attacker, target, level) => {
    target.addEffect("blindness", 60 + level * 30, {
      amplifier: Math.min(level - 1, 4),
      showParticles: false,
    });
  },
  regeneration: (attacker, target, level) => {
    attacker.addEffect("regeneration", 60 + level * 30, {
      amplifier: Math.min(level - 1, 4),
      showParticles: false,
    });
  },
  cleansing: (attacker, target, level) => {
    const probability = Math.min(level / 3, 1);
    if (Math.random() < probability) {
      clearEffect(attacker, "bad");
    }
  },
  stun: (attacker, target, level) => {
    target.addEffect("slowness", 0 + level * 20, {
      amplifier: Math.min(level * 2, 255),
      showParticles: false,
    });
  },
  battle_fury: (attacker, target, level) => {
    attacker.addEffect("strength", 20 + level * 20, {
      amplifier: Math.min(level - 1, 4),
      showParticles: false,
    });
  },
  concuss: (attacker, target, level) => {
    target.addEffect("nausea", 20 + level * 40, {
      amplifier: Math.min(level - 1, 4),
      showParticles: false,
    });
  },
  bleeding: (attacker, target, level) => {
    addBleedingEffect(target, level)
  },
  accumulate: () => {},
};

function clampLevel(level) {
  if (!Number.isFinite(level)) return 0;
  if (level < 0) return 0;
  if (level > 9) return 9;
  return level;
}

const bleedingStates = new Map();

export function addBleedingEffect(target, level) {
  if (!target || !target.isValid) return;

  const healthComp = target.getComponent("minecraft:health");
  if (!healthComp) return;

  const tick = system.currentTick;
  const existing = bleedingStates.get(target.id);

  // 无敌帧：10 tick 内的重复攻击忽略
  if (existing && tick - existing.lastHitTick < 10) {
    return;
  }

  const durationTicks = (3 + level) * 20;

  // 已有失血：延长结束时间、更新等级，不重置计时器
  if (existing) {
    existing.level = level;
    existing.endTick = tick + durationTicks;
    existing.lastHitTick = tick;
    return;
  }

  const state = {
    level,
    endTick: tick + durationTicks,
    lastHitTick: tick,
    intervalId: undefined,
  };

  const intervalId = system.runInterval(() => {
    const now = system.currentTick;
    const s = bleedingStates.get(target.id);

    if (!s || now >= s.endTick) {
      system.clearRun(intervalId);
      bleedingStates.delete(target.id);
      return;
    }

    if (!target || !target.isValid) {
      system.clearRun(intervalId);
      bleedingStates.delete(target.id);
      return;
    }

    const health = target.getComponent("minecraft:health");
    if (!health || health.currentValue <= 0) {
      system.clearRun(intervalId);
      bleedingStates.delete(target.id);
      return;
    }

    let damage;
    if (s.level < 2) {
      damage = s.level;
    } else {
      damage = 3 + health.effectiveMax * 0.01 * s.level;
    }
    damage = Math.max(1, Math.floor(damage));

    const pos = target.location;
    const dim = target.dimension;
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const offset = {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.6 + 0.5,
        z: (Math.random() - 0.5) * 0.8,
      };
      dim.spawnParticle("minecraft:redstone_wire_dust_particle", {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
        z: pos.z + offset.z,
      });
    }

    const newHealth = Math.max(0, health.currentValue - damage);
    try {
      health.setCurrentValue(newHealth);
    } catch (e) {
      console.error("[Stonecraft] bleeding damage failed:", e);
      system.clearRun(intervalId);
      bleedingStates.delete(target.id);
      return;
    }

    if (newHealth <= 0) {
      system.clearRun(intervalId);
      bleedingStates.delete(target.id);
    }
  }, 20);

  state.intervalId = intervalId;
  bleedingStates.set(target.id, state);
}

function applyItemDynamicEffects(attacker, target) {
  const item = getMainHandItem(attacker);
  if (!item) return false;

  let applied = false;

  for (const def of ATTRIBUTE_DEFS) {
    const level = clampLevel(getAttributeLevel(item, def));
    if (level <= 0) continue;

    const handler = EFFECT_HANDLERS[def.id];
    if (!handler) continue;

    try {
      handler(attacker, target, level); // 传入 attacker 和 target
      applied = true;
    } catch (error) {
      console.error("[Stonecraft] item dynamic effect failed:", error);
    }
  }

  return applied;
}

const ACCUMULATE_MULTIPLIERS = [1.2, 1.5, 2.0];
const ACCUMULATE_WINDOW_TICKS = 60;

const accumulateWindows = new Map(); // targetId -> { attackerId, attackerRef, targetRef, damage, level, deadline }

const accumulateGraceUntil = new Map(); // targetId -> 空窗期结束 tick

const accumulateLastHit = new Map(); // targetId -> 上次有效命中 tick

export function processAccumulateHit(attacker, target, damage, cause) {
  if (cause !== "entityAttack") return false;

  const tick = system.currentTick;
  const graceUntil = accumulateGraceUntil.get(target.id) ?? -1;

  // 空窗期：放行（积爆自己的爆发伤害，或刚好落在窗口内的其他伤害）
  if (tick < graceUntil) return false;

  const weapon = getMainHandItem(attacker);
  if (!weapon) return false;

  const level = clampLevel(getOrZero(weapon, "stonecraft:accumulate_level", 0));
  if (level <= 0) return false;

  // 无敌帧检查：10 tick 内的重复攻击拦截但不累加
  const lastHit = accumulateLastHit.get(target.id) ?? -Infinity;
  if (tick - lastHit < 10) {
    return true;
  }
  accumulateLastHit.set(target.id, tick);

  const existing = accumulateWindows.get(target.id);
  if (existing && existing.attackerId === attacker.id) {
    existing.damage += damage;
    existing.level = level;
    return true;
  }
  if (existing) {
    accumulateWindows.delete(target.id);
  }

  accumulateWindows.set(target.id, {
    attackerId: attacker.id,
    attackerRef: attacker,
    targetRef: target,
    damage,
    level,
    deadline: tick + ACCUMULATE_WINDOW_TICKS,
    lastFizzTick: tick - 10,
  });

  return true;
}

function tickAccumulateWindows() {
  const tick = system.currentTick;

  for (const [id, lastTick] of accumulateLastHit) {
    if (tick - lastTick > 100) {
      accumulateLastHit.delete(id);
    }
  }

  if (accumulateWindows.size === 0) return;

  for (const [targetId, record] of accumulateWindows) {
    const target = record.targetRef;
    if (!target || !target.isValid) {
      accumulateWindows.delete(targetId);
      continue;
    }

    // 未到结算时间：持续播放积攒音效
    if (tick < record.deadline) {
      if (tick - record.lastFizzTick >= 10) {
        record.lastFizzTick = tick;
        try {
          target.dimension.playSound("random.fizz", target.location, {
            volume: 0.6,
            pitch: 0.8 + Math.random() * 0.4,
          });
        } catch {}
      }
      continue;
    }

    // 结算
    accumulateWindows.delete(targetId);

    const health = target.getComponent("minecraft:health");
    if (!health || health.currentValue <= 0) continue;

    const multiplier = ACCUMULATE_MULTIPLIERS[Math.min(record.level, 3)] ?? 1;
    const finalDamage = record.damage * multiplier;

    accumulateGraceUntil.set(targetId, tick + 10);
    accumulateLastHit.set(targetId, tick);

    // 结算视听
    try {
      target.dimension.playSound("mob.wither.break_block", target.location, {
        volume: 1.0,
        pitch: 1.0 + Math.random() * 0.2,
      });
      target.dimension.spawnParticle("minecraft:critical_hit_emitter", {
        x: target.location.x,
        y: target.location.y + 1.0,
        z: target.location.z,
      });
    } catch {}

    try {
      const attacker = record.attackerRef;
      target.applyDamage(finalDamage, {
        cause: "entityAttack",
        damagingEntity: attacker && attacker.isValid ? attacker : undefined,
      });
    } catch (e) {
      console.warn("[Stonecraft] accumulate burst failed", e);
    }
  }
}

function applyLegacyUcStoneSwordEffects(attacker, target) {
  const item = getMainHandItem(attacker);
  if (!item?.typeId?.endsWith("uc_stone_sword")) return false;

  let applied = false;

  for (const def of ATTRIBUTE_DEFS) {
    const level = clampLevel(getOrZero(attacker, def.playerKey, 0));
    if (level <= 0) continue;

    const handler = EFFECT_HANDLERS[def.id];
    if (!handler) continue;

    try {
      handler(attacker, target, level); // 传入 attacker 和 target
      applied = true;
    } catch (error) {
      console.error("[Stonecraft] legacy weapon effect failed:", error);
    }
  }

  return applied;
}

export function initWeaponEffects() {
  const hitEvent = world.afterEvents.entityHitEntity;
  if (!hitEvent) return;

  const beforeHurt = world.beforeEvents.entityHurt;
  if (beforeHurt?.subscribe) {
    beforeHurt.subscribe((event) => {
      try {
        const target = event.hurtEntity;
        if (!target || target.typeId === "minecraft:player") return;

        const source = event.damageSource;
        if (!source?.damagingEntity || source.damagingEntity.typeId !== "minecraft:player") return;

        const cause = source.cause;
        if (cause !== "entityAttack") return;

        const cancelled = processAccumulateHit(
          source.damagingEntity,
          target,
          event.damage,
          cause
        );

        if (cancelled) {
          event.cancel = true;
        }
      } catch (e) {
        console.warn("[Stonecraft] accumulate beforeHurt failed", e);
      }
    });
  }
  hitEvent.subscribe((event) => {
    try {
      const attacker = event.damagingEntity ?? event.damager ?? event.entity;
      const target = event.hitEntity ?? event.entityHitEntity ?? event.hitEntity;
      if (!attacker || attacker.typeId !== "minecraft:player") return;
      if (!target || typeof target.addEffect !== "function") return;

      const cacheKeys = ATTRIBUTE_DEFS.map((def) => def.playerKey);
      let appliedAny = false;

      for (const def of ATTRIBUTE_DEFS) {
        const level = clampLevel(getOrZero(attacker, def.playerKey, 0));
        if (level <= 0) continue;

        const handler = EFFECT_HANDLERS[def.id];
        if (!handler) continue;

        try {
          handler(attacker, target, level); // 传入 attacker 和 target
          appliedAny = true;
        } catch (error) {
          console.error("[Stonecraft] effect handler failed:", error);
        }
      }

      if (!appliedAny) {
        appliedAny = applyItemDynamicEffects(attacker, target) || applyLegacyUcStoneSwordEffects(attacker, target);
      }

      for (const key of cacheKeys) {
        const total = clampLevel(getOrZero(attacker, key, 0));
        if (total < 0) {
          attacker.setDynamicProperty(key, 0);
        }
      }
    } catch (error) {
      console.error("[Stonecraft] entityHitEntity failed:", error);
    }
  });
  system.runInterval(tickAccumulateWindows, 1);
}