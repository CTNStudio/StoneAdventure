import { world } from "@minecraft/server";
import { ATTRIBUTE_DEFS, getAttributeLevel, getMainHandItem } from "../forge_utils.js";

const CRIT_MULTIPLIER = 1.5;
const KEEN_CHANCES = [0.1, 0.2, 0.3];
const EXECUTE_THRESHOLDS = [0.2, 0.3, 0.4];
const SUNDER_DAMAGES = [1, 2, 3];

const DEFS = {};
for (const def of ATTRIBUTE_DEFS) DEFS[def.id] = def;

function tier(level) {
  return Math.min(Math.max(level, 1), 3) - 1;
}

function weaponLevel(weapon, id) {
  const def = DEFS[id];
  return def ? getAttributeLevel(weapon, def) : 0;
}

function rollModifiers(attacker, target, damage) {
  const weapon = getMainHandItem(attacker);
  if (!weapon) return damage;

  let value = damage;

  const executeLevel = weaponLevel(weapon, "execute");
  if (executeLevel > 0) {
    const health = target.getComponent("minecraft:health");
    if (health && health.effectiveMax > 0) {
      const ratio = health.currentValue / health.effectiveMax;
      if (ratio <= EXECUTE_THRESHOLDS[tier(executeLevel)]) value *= 2;
    }
  }

  const keenLevel = weaponLevel(weapon, "keen");
  if (keenLevel > 0 && Math.random() < KEEN_CHANCES[tier(keenLevel)]) {
    value *= CRIT_MULTIPLIER;
    try {
      target.dimension.spawnParticle("minecraft:critical_hit_emitter", {
        x: target.location.x,
        y: target.location.y + 1.0,
        z: target.location.z,
      });
    } catch {}
  }

  return value;
}

function applySunder(attacker, target) {
  const weapon = getMainHandItem(attacker);
  if (!weapon) return;

  const level = weaponLevel(weapon, "sunder");
  if (level <= 0) return;

  try {
    const health = target.getComponent("minecraft:health");
    if (!health || health.currentValue <= 0) return;
    health.setCurrentValue(Math.max(0, health.currentValue - SUNDER_DAMAGES[tier(level)]));
  } catch {}
}

export function initDamageEffects() {
  world.beforeEvents.entityHurt.subscribe((event) => {
    const source = event.damageSource;
    if (!source || source.cause !== "entityAttack") return;

    const attacker = source.damagingEntity;
    if (!attacker || attacker.typeId !== "minecraft:player") return;

    const target = event.hurtEntity;
    if (!target || target.typeId === "minecraft:player") return;

    try {
      event.damage = rollModifiers(attacker, target, event.damage);
    } catch {}
  });

  world.afterEvents.entityHitEntity.subscribe((event) => {
    const attacker = event.damagingEntity;
    if (!attacker || attacker.typeId !== "minecraft:player") return;
    const target = event.hitEntity;
    if (!target) return;
    applySunder(attacker, target);
  });
}
