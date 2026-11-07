//「最后一击归属」登记：直接改血造成的击杀（破甲、失血）不经过引擎的伤害来源系统，
//entityDie.damageSource.damagingEntity 因此是空的，任务/成就/祝福都看不到击杀者。
//这里在「这一下会打死目标」的瞬间记一份归属，由消费方在 entityDie 里兜底查询。
//注意：只能作用于我们自己的消费方；经验球掉落这类引擎侧的击杀归属无法通过脚本恢复。
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

  try {
    return record.attackerRef?.isValid ? record.attackerRef : undefined;
  } catch {
    return undefined;
  }
}

export function clearLethalCredit(target) {
  if (target?.id) credits.delete(target.id);
}

function pruneCredits() {
  const tick = system.currentTick;
  for (const [id, record] of credits) {
    if (tick - record.tick > CREDIT_TTL_TICKS) credits.delete(id);
  }
}

system.runInterval(pruneCredits, 100);
