import { system, world } from "@minecraft/server";
import { hasBless } from "./index.js";
import { addStonePoint } from "../stone_point.js";
import { getLethalCredit } from "../forge/damage_credit.js";

const BLESS = {
  stoneSource: 1,
  extraXp: 2,
  weekly: 3,
  sonic: 4,
  keepXp: 5,
  doll: 6,
  weapon: 7,
};

const STONE_POINT_PER_KILL = 1;
const EXTRA_XP_PER_KILL = 5;
const KEEP_XP_RATIO = 0.5;

const STONE_FAMILIES = ["stone", "stone_boss"];
const deathLevels = new Map(); // playerId -> 死亡时等级

//石头生物 = type_family 含 stone 或 stone_boss
function isStoneBorn(entity) {
  if (!entity) return false;
  for (const family of STONE_FAMILIES) {
    try {
      if (entity.matches(family)) return true;
    } catch {
    }
  }
  //兜底：实体在死亡事件里可能已经查不到 family，用 id 命中
  return String(entity.typeId ?? "").toLowerCase().includes("stone");
}

//击杀者的 damagingEntity 经常是空的（尤其近战），退化为"死亡位置附近的玩家"
function resolveKiller(dead, damageSource) {
  let killer;
  try {
    killer = damageSource?.damagingEntity;
  } catch {
  }
  if (killer?.typeId === "minecraft:player" && killer.isValid) return killer;

  //破甲/失血这类直接改血的最后一击：优先用锻造模块登记的归属，比"附近玩家"准确
  const credited = getLethalCredit(dead);
  if (credited?.isValid) return credited;

  let players;
  try {
    players = dead.dimension.getPlayers({ location: dead.location, maxDistance: 32 });
  } catch {
    return undefined;
  }
  let best;
  let bestDist = Infinity;
  for (const player of players) {
    const dx = player.location.x - dead.location.x;
    const dy = player.location.y - dead.location.y;
    const dz = player.location.z - dead.location.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      best = player;
    }
  }
  return best;
}

// ---------------------------------------------------------------- 祝福 4：免疫声波

world.beforeEvents.entityHurt.subscribe((event) => {
  const hurt = event.hurtEntity;
  if (hurt?.typeId !== "minecraft:player") return;
  if (!hasBless(hurt, BLESS.sonic)) return;
  try {
    const cause = event.damageSource?.cause;
    if (cause !== "sonicBoom") return;
    event.cancel = true;
  } catch {
  }
});

// ---------------------------------------------------------------- 祝福 1 / 2：击杀奖励

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (!dead) return;

  const killer = resolveKiller(dead, event.damageSource);
  if (!killer?.isValid) return;

  try {
    if (hasBless(killer, BLESS.stoneSource) && isStoneBorn(dead)) {
      addStonePoint(killer, STONE_POINT_PER_KILL);
    }
  } catch (error) {
    console.error("[SevenCurses] stone point blessing failed:", error);
  }

  try {
    if (hasBless(killer, BLESS.extraXp)) {
      killer.addExperience(EXTRA_XP_PER_KILL);
    }
  } catch {
  }
});

// ---------------------------------------------------------------- 祝福 5：死亡保留经验

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead?.typeId !== "minecraft:player") return;
  try {
    deathLevels.set(dead.id, Math.max(0, dead.level ?? 0));
  } catch {
  }
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  const player = event.player;
  if (!player?.isValid) return;
  const saved = deathLevels.get(player.id);
  if (saved === undefined) return;
  deathLevels.delete(player.id);

  system.run(() => {
    if (!player.isValid) return;
    try {
      if (!hasBless(player, BLESS.keepXp)) return;
      const levels = Math.floor(saved * KEEP_XP_RATIO);
      if (levels > 0) player.addLevels(levels);
    } catch {
    }
  });
});

world.afterEvents.playerLeave.subscribe((event) => {
  deathLevels.delete(event.playerId);
});

export { BLESS, KEEP_XP_RATIO, EXTRA_XP_PER_KILL, STONE_POINT_PER_KILL };
