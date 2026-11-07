import {
  EquipmentSlot,
  EntityComponentTypes,
  system,
  world,
} from "@minecraft/server";

import {
  ATTRIBUTE_DEFS,
  getOrZero,
} from "./forge_utils.js";

import {
  TIMED_EFFECT_CONFIG,
  applyTimedSustainedEffects,
  isPlayerValid,
} from "./armor_timed_effects.js";

const ARMOR_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
];

const WEAPON_SLOTS = [
  EquipmentSlot.Mainhand,
];

const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, ...WEAPON_SLOTS];

//按「四件护甲」统计的属性集合，其余属性只统计主手。
//armorOnly 由 TIMED_EFFECT_CONFIG 决定（见 armor_timed_effects.js 的注释）
const ARMOR_ONLY_IDS = new Set(
  Object.values(TIMED_EFFECT_CONFIG)
    .filter((config) => config.armorOnly)
    .map((config) => config.effectId)
);

//玩家属性的内存镜像：值没变就不再写动态属性
//（原实现每秒对每个玩家固定写 22×2 次，且每个背包事件都会排一次全量重算）
const attrCache = new Map(); // playerId -> { [key]: value }

function getEquipmentItem(player, slot) {
  try {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    return equip ? equip.getEquipment(slot) ?? undefined : undefined;
  } catch {
    return undefined;
  }
}

function writeAttrIfChanged(player, key, value) {
  let cache = attrCache.get(player.id);
  if (!cache) {
    cache = Object.create(null);
    attrCache.set(player.id, cache);
  }
  if (cache[key] === value) return;

  try {
    player.setDynamicProperty(key, value);
    cache[key] = value;
  } catch {
  }
}

function applySustainedEffects(player) {
  try {
    applyTimedSustainedEffects(player);
  } catch (error) {
    console.error("[Stonecraft] applySustainedEffects failed:", error);
  }
}

export function updatePlayerAttributes(player) {
  if (!isPlayerValid(player)) return;

  try {
    for (const def of ATTRIBUTE_DEFS) {
      const slots = ARMOR_ONLY_IDS.has(def.id) ? ARMOR_SLOTS : WEAPON_SLOTS;

      let total = 0;
      for (const slot of slots) {
        const item = getEquipmentItem(player, slot);
        if (!item) continue;
        total += getOrZero(item, def.key, 0);
      }

      writeAttrIfChanged(player, def.playerKey, total);
    }

    applySustainedEffects(player);
  } catch (error) {
    console.error("[Stonecraft] updatePlayerAttributes failed:", error);
  }
}

// ---------------------------------------------------------------- 更新调度
//同一批事件（拾取 / 换装 / 换槽）只排一次重算，避免回调风暴吃满每 tick 的调用预算

const MAX_ATTEMPTS = 2;

const pendingUpdates = new Map(); // playerId -> { player, attempts }
const pendingNames = new Map();   // playerName -> attempts（join 早期拿不到 player 引用）

let flushScheduled = false;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;

  system.runTimeout(() => {
    flushScheduled = false;
    flushPendingUpdates();
  }, 2);
}

function scheduleRetry(player, attempt = 0) {
  if (!isPlayerValid(player)) return;

  const existing = pendingUpdates.get(player.id);
  if (existing) {
    existing.player = player;
    if (attempt > existing.attempts) existing.attempts = attempt;
  } else {
    pendingUpdates.set(player.id, { player, attempts: attempt });
  }

  scheduleFlush();
}

function scheduleByName(playerName) {
  if (!playerName) return;
  if (pendingNames.has(playerName)) return;

  pendingNames.set(playerName, 0);
  scheduleFlush();
}

function resolvePendingNames() {
  if (pendingNames.size === 0) return;

  let unanswered = false;
  for (const [playerName, attempts] of [...pendingNames]) {
    let player;
    try {
      player = world.getPlayers({ name: playerName })[0];
    } catch {
      player = undefined;
    }

    if (player) {
      pendingNames.delete(playerName);
      pendingUpdates.set(player.id, { player, attempts: 0 });
    } else if (attempts >= MAX_ATTEMPTS) {
      pendingNames.delete(playerName);
    } else {
      pendingNames.set(playerName, attempts + 1);
      unanswered = true;
    }
  }

  //还没查到人：下一轮 flush 再试，超过 MAX_ATTEMPTS 就放弃
  if (unanswered) scheduleFlush();
}

function flushPendingUpdates() {
  resolvePendingNames();
  if (pendingUpdates.size === 0) return;

  const batch = [...pendingUpdates.values()];
  pendingUpdates.clear();

  for (const { player, attempts } of batch) {
    if (!isPlayerValid(player)) continue;

    try {
      updatePlayerAttributes(player);
    } catch (error) {
      console.error("[Stonecraft] retry updatePlayerAttributes failed:", error);
      if (attempts < MAX_ATTEMPTS) scheduleRetry(player, attempts + 1);
    }
  }
}

let playerAttributesInitialized = false;

export function initPlayerAttributes() {
  if (playerAttributesInitialized) return;
  playerAttributesInitialized = true;

  const afterEvents = world?.afterEvents ?? {};

  if (afterEvents.playerJoin?.subscribe) {
    afterEvents.playerJoin.subscribe((event) => {
      if (isPlayerValid(event.player)) scheduleRetry(event.player);
      else if (event.playerName) scheduleByName(event.playerName);
    });
  }

  if (afterEvents.playerSpawn?.subscribe) {
    afterEvents.playerSpawn.subscribe((event) => {
      if (isPlayerValid(event.player)) scheduleRetry(event.player);
    });
  }

  if (afterEvents.playerInventoryItemChange?.subscribe) {
    afterEvents.playerInventoryItemChange.subscribe((event) => {
      if (isPlayerValid(event.player)) scheduleRetry(event.player);
    });
  }

  if (afterEvents.playerArmorChange?.subscribe) {
    afterEvents.playerArmorChange.subscribe((event) => {
      if (isPlayerValid(event.player)) scheduleRetry(event.player);
    });
  }

  if (afterEvents.playerSlotChange?.subscribe) {
    afterEvents.playerSlotChange.subscribe((event) => {
      const player = event.player;
      if (!isPlayerValid(player)) return;
      if (!EQUIPMENT_SLOTS.includes(event.slot)) return;
      scheduleRetry(player);
    });
  }

  if (afterEvents.itemCompleteUse?.subscribe) {
    afterEvents.itemCompleteUse.subscribe((event) => {
      const player = event.source;
      if (!isPlayerValid(player)) return;
      if (event.itemStack?.typeId !== "minecraft:milk_bucket") return;
      scheduleRetry(player);
    });
  }

  if (afterEvents.playerLeave?.subscribe) {
    afterEvents.playerLeave.subscribe((event) => {
      attrCache.delete(event.playerId);
      pendingUpdates.delete(event.playerId);
    });
  }

  //每秒全量兜底一次（值没变不会写动态属性，代价只有 22 次内存比较 + 每秒一次效果扫描）
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!isPlayerValid(player)) continue;
      updatePlayerAttributes(player);
    }
  }, 20);
}
