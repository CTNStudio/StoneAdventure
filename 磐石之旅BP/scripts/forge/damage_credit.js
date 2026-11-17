//「最后一击归属」登记：直接改血造成的击杀（破甲、失血）不经过引擎的伤害来源系统，
//entityDie.damageSource.damagingEntity 因此是空的，任务/成就/祝福都看不到击杀者。
//这里在「这一下会打死目标」的瞬间记一份归属，由消费方在 entityDie 里兜底查询。
import { system } from "@minecraft/server";

//只在致命那一 tick 附近有效，避免把「先挂失血、后死于坠落」误算成玩家击杀
const CREDIT_TTL_TICKS = 60;

const credits = new Map(); // entityId -> { attackerRef, tick }

export function recordLethalCredit(target, attacker) {
  if (!target?.id || !attacker?.id) return;

  credits.set(target.id, {
    attackerRef: attacker,
    tick: system.currentTick,
  });
}

export function getLethalCredit(target) {
  const id = target?.id;
  if (!id) return undefined;

  const record = credits.get(id);
  if (!record) return undefined;

  if (system.currentTick - record.tick > CREDIT_TTL_TICKS) {
    credits.delete(id);
    return undefined;
  }

  return record.attackerRef?.isValid ? record.attackerRef : undefined;
}

export function clearLethalCredit(target) {
  if (target?.id) credits.delete(target.id);
}

//「附近玩家」兜底的搜索半径（格）
const NEAREST_KILLER_RADIUS = 32;

/**
 * 击杀归属解析（三级兜底，供所有「玩家击杀了 X 之后……」的逻辑共用）：
 * 1) damageSource.damagingEntity 就是玩家；
 * 2) 锻造模块登记的最后一击归属——破甲/失血这类直接改血的击杀，引擎看不到伤害来源；
 * 3) 死亡位置附近最近的玩家。
 *
 * nearestFallback: false 时只认前两级。任务/周常这类「击杀计数」不希望
 * 把「被铁傀儡打死」也算到路过的玩家头上，就传 false；掉落/祝福这类默认 true。
 */
export function resolveKiller(dead, damageSource, { nearestFallback = true } = {}) {
  if (!dead) return undefined;

  let direct;
  try {
    direct = damageSource?.damagingEntity;
  } catch {
  }
  if (direct?.typeId === "minecraft:player" && direct.isValid) return direct;

  const credited = getLethalCredit(dead);
  if (credited?.isValid) return credited;

  if (!nearestFallback) return undefined;

  let players;
  try {
    players = dead.dimension.getPlayers({ location: dead.location, maxDistance: NEAREST_KILLER_RADIUS });
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

function pruneCredits() {
  const tick = system.currentTick;
  for (const [id, record] of credits) {
    if (tick - record.tick > CREDIT_TTL_TICKS) credits.delete(id);
  }
}

system.runInterval(pruneCredits, 100);
