import { system, world } from "@minecraft/server";

export const SEAL_TAG = "stonecraft:seven_seal";
const CURSE_PREFIX = "stonecraft:seven_curse_";
const BLESS_PREFIX = "stonecraft:seven_bless_";
const CURSE_REMOVED_PREFIX = "stonecraft:seven_curse_removed_";
//解除过至少一条诅咒的通用标记；按条区分的标记见 curseRemovedTag(id)
export const CURSE_REMOVED_TAG = "stonecraft:seven_curse_removed";

export const CURSE_IDS = [1, 2, 3, 4, 5, 6, 7];
export const BLESS_IDS = [1, 2, 3, 4, 5, 6, 7];

const cursedPlayers = new Set();
const effectModules = [];

function safeHasTag(player, tag) {
  try {
    return !!player?.isValid && player.hasTag(tag);
  } catch {
    return false;
  }
}

export function curseTag(id) {
  return CURSE_PREFIX + id;
}

export function curseRemovedTag(id) {
  return CURSE_REMOVED_PREFIX + id;
}

export function blessTag(id) {
  return BLESS_PREFIX + id;
}

export function hasSeal(player) {
  return safeHasTag(player, SEAL_TAG);
}

export function hasCurse(player, id) {
  return safeHasTag(player, curseTag(id));
}

export function hasBless(player, id) {
  return safeHasTag(player, blessTag(id));
}

export function getCursedPlayers() {
  return [...cursedPlayers];
}

export function grantSeal(player) {
  if (!player?.isValid) return false;
  try {
    player.addTag(SEAL_TAG);
    for (const id of CURSE_IDS) player.addTag(curseTag(id));
    for (const id of BLESS_IDS) player.addTag(blessTag(id));
  } catch {
    return false;
  }
  cursedPlayers.add(player);
  return true;
}

export function removeCurse(player, id) {
  let hadCurse = false;
  try {
    if (!player?.isValid) return false;
    //removeTag 删不存在的 tag 不会报错，所以必须先读一次才能分辨「真的解除了」
    hadCurse = player.hasTag(curseTag(id));
    player.removeTag(curseTag(id));
  } catch {
    return false;
  }
  //只有真的解除过才留下永久标记，供任务/成就的 playerTag 判定读取
  if (hadCurse) {
    try {
      player.addTag(curseRemovedTag(id));
      player.addTag(CURSE_REMOVED_TAG);
    } catch {
    }
  }
  //移除成功后派发 onRemoved，让效果模块清理自己留下的即时效果（例如低光失明留下的 blindness）
  notifyRemoved(player, "curse", id);
  return true;
}

export function removeBlessing(player, id) {
  try {
    if (!player?.isValid) return false;
    player.removeTag(blessTag(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * 注册效果模块：{ tick?(player), onBind?(player), onRemoved?(player, kind, id) }
 * - tick：每 20 tick 对背负封印的玩家调用一次
 * - onBind：grantSeal 成功后调用
 * - onRemoved：removeCurse 成功后调用（kind = "curse"），用于清理该条诅咒留下的即时效果
 */
export function registerEffectModule(module) {
  if (module) effectModules.push(module);
}

function refreshCursedCache() {
  cursedPlayers.clear();
  for (const player of world.getPlayers()) {
    if (hasSeal(player)) cursedPlayers.add(player);
  }
}

function tickCursedPlayer(player) {
  for (const module of effectModules) {
    if (typeof module.tick !== "function") continue;
    try {
      module.tick(player);
    } catch (error) {
      console.error("[SevenCurses] effect tick failed:", error);
    }
  }
}

export function notifyBind(player) {
  for (const module of effectModules) {
    if (typeof module.onBind !== "function") continue;
    try {
      module.onBind(player);
    } catch {
    }
  }
}

//派发解咒清理。祝福暂不需要清理逻辑，所以 removeBlessing 不派发
function notifyRemoved(player, kind, id) {
  for (const module of effectModules) {
    if (typeof module.onRemoved !== "function") continue;
    try {
      module.onRemoved(player, kind, id);
    } catch {
    }
  }
}

world.afterEvents.playerLeave.subscribe((event) => {
  const id = event.playerId;
  for (const player of [...cursedPlayers]) {
    if (player.id === id) cursedPlayers.delete(player);
  }
});

//首次缓存由 system.runInterval 在第一轮触发时填充，
//不能在模块顶层调用（world.getPlayers 属于 early execution 禁用项）
system.runInterval(() => {
  refreshCursedCache();
  for (const player of cursedPlayers) {
    if (!player?.isValid) continue;
    tickCursedPlayer(player);
  }
}, 20);
