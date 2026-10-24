import { world, system } from "@minecraft/server";

const GROUP_RADIUS = 32;// 群体激怒半径
const NEAR_RADIUS = 4;// 贴身判定半径

//entityId -> { playerId, ticks }
const nearTimers = new Map();

function isVagabond(entity) {
  try {
    return entity?.isValid && entity.typeId === "stonecraft:stone_vagabond";
  } catch {
    return false;
  }
}

function makeAngry(entity) {
  try {
    if (!entity.isValid) return;
    entity.triggerEvent("minecraft:start_angry_event");
  } catch {
  }
}

//群体激怒：玩家击中某个石中游魂，半径内同类一起愤怒
world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  try {
    if (!isVagabond(hurtEntity)) return;
    const attacker = damageSource?.damagingEntity;
    if (!attacker || attacker.typeId !== "minecraft:player") return;

    for (const other of hurtEntity.dimension.getEntities({
      location: hurtEntity.location,
      maxDistance: GROUP_RADIUS,
      type: "stonecraft:stone_vagabond",
    })) {
      makeAngry(other);
    }
  } catch {
  }
});

//贴身激怒：玩家在 NEAR_RADIUS 内持续 100 刻
system.runInterval(() => {
  const seen = new Set();

  for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
    let vagabonds;
    try {
      vagabonds = world.getDimension(dimensionId).getEntities({ type: "stonecraft:stone_vagabond" });
    } catch {
      continue;
    }

    for (const vagabond of vagabonds) {
      if (!vagabond.isValid) continue;
      seen.add(vagabond.id);

      let nearest;
      try {
        nearest = vagabond.dimension.getPlayers({
          location: vagabond.location,
          maxDistance: NEAR_RADIUS,
          closest: 1,
        })[0];
      } catch {
        nearest = undefined;
      }

      if (!nearest) {
        nearTimers.delete(vagabond.id);
        continue;
      }

      const record = nearTimers.get(vagabond.id);
      //换了玩家就重新计时
      if (!record || record.playerId !== nearest.id) {
        nearTimers.set(vagabond.id, { playerId: nearest.id, ticks: 10 });
        continue;
      }

      record.ticks += 10;
      if (record.ticks >= 100) {
        nearTimers.delete(vagabond.id);
        makeAngry(vagabond);
      }
    }
  }

  //清理已消失的实体
  for (const id of nearTimers.keys()) {
    if (!seen.has(id)) nearTimers.delete(id);
  }
}, 10);
