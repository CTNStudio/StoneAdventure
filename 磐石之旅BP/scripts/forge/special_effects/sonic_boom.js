import { EntityDamageCause } from "@minecraft/server";

//监守者尖啸：沿视线 15 格、穿墙、只命中第一个生物
export function fireSonicBoom(player, damage) {
  const dimension = player.dimension;
  const origin = player.getHeadLocation();
  const direction = player.getViewDirection();

  dimension.playSound("mob.warden.sonic_boom", origin);

  try {
    for (let step = 1; step <= 15; step++) {
      dimension.spawnParticle("minecraft:sonic_explosion", {
        x: origin.x + direction.x * step,
        y: origin.y + direction.y * step,
        z: origin.z + direction.z * step
      });
    }
  } catch (error) {
    //光束射穿世界高度边界时引擎会抛错，后面的粒子不必再生成
    if (error?.name !== "LocationOutOfWorldBoundariesError") throw error;
  }

  const hit = dimension
    .getEntitiesFromRay(origin, direction, { maxDistance: 15 })
    .find(({ entity }) => entity.id !== player.id && entity.getComponent("minecraft:health"));

  if (!hit) return;

  const target = hit.entity;
  target.applyDamage(damage, {
    cause: EntityDamageCause.sonicBoom,
    damagingEntity: player
  });

  const horizontal = Math.hypot(direction.x, direction.z) || 1;
  target.applyKnockback({
    x: (direction.x / horizontal) * 2.5,
    z: (direction.z / horizontal) * 2.5
  }, 0.5);
}
