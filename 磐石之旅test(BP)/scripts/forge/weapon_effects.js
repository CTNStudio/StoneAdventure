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
};

function clampLevel(level) {
  if (!Number.isFinite(level)) return 0;
  if (level < 0) return 0;
  if (level > 9) return 9;
  return level;
}

const bleedingTimers = new Map();

export function addBleedingEffect(target, level) {
    if (!target || !target.isValid) return;

    // 如果目标已经存在流血，先清除旧流血
    const existingTimer = bleedingTimers.get(target.id);

    if (existingTimer !== undefined) {
        system.clearRun(existingTimer);
        bleedingTimers.delete(target.id);
    }

    const healthComp = target.getComponent("minecraft:health");
    if (!healthComp) return;

    const duration = 3 + level;
    let elapsed = 0;

    const intervalId = system.runInterval(() => {
        elapsed += 1;

        // 目标已经失效
        if (!target || !target.isValid) {
            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
            return;
        }

        const health = target.getComponent("minecraft:health");

        if (!health) {
            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
            return;
        }

        // 持续时间结束
        if (elapsed > duration) {
            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
            return;
        }

        let damage;

        // 你的伤害计算
        if (level < 2) {
            damage = level;
        } else {
            damage = 3 + health.effectiveMax * 0.01;
        }

        damage = Math.max(1, Math.floor(damage));

        const currentHealth = health.currentValue;

        const pos = target.location;
        const dim = target.dimension;
        const particleCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
          const offset = {
            x: (Math.random() - 0.5) * 0.8,
            y: (Math.random() - 0.5) * 0.6 + 0.5, // 集中在躯干高度
            z: (Math.random() - 0.5) * 0.8
          };
          dim.spawnParticle("minecraft:redstone_wire_dust_particle", {
            x: pos.x + offset.x,
            y: pos.y + offset.y,
            z: pos.z + offset.z
          });
        }

        // 已经死亡
        if (currentHealth <= 0) {
            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
            return;
        }

        // 直接扣除生命值
        const newHealth = Math.max(
            0,
            currentHealth - damage
        );

        try {
            health.setCurrentValue(newHealth);
        } catch (error) {
            console.error(
                "[Stonecraft] bleeding damage failed:",
                error
            );

            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
            return;
        }

        // 目标死亡
        if (newHealth <= 0) {
            system.clearRun(intervalId);
            bleedingTimers.delete(target.id);
        }

    }, 20);

    bleedingTimers.set(target.id, intervalId);
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
}