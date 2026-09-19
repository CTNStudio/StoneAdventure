import {
  world,
  EquipmentSlot,
  EntityComponentTypes,
} from "@minecraft/server";

import {
  getOrZero,
} from "./forge_utils.js";

// 获取玩家主手物品
function getMainHandItem(player) {
  try {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    return equip ? equip.getEquipment(EquipmentSlot.Mainhand) ?? undefined : undefined;
  } catch {
    return undefined;
  }
}

// 判断物品是否是矛（依据 forge_ 标签）
function isSpearItem(item) {
  if (!item) return false;
  try {
    const tags = item.getTags ? item.getTags() : [];
    return tags.some(tag => tag.startsWith("forge_") && tag.slice(6) === "spear");
  } catch {
    return false;
  }
}

// 获取玩家的迅捷总等级
function getSpearSpeedLevel(player) {
  return getOrZero(player, "stonecraft:dash", 0);
}

// 施加/刷新速度效果
function applySpearSpeed(player, level) {
  if (level <= 0) return;
  const amplifier = Math.min(Math.max(level, 0), 5); // 速度等级上限 IV
  try {
    player.setDynamicProperty("stonecraft:dash_managed", 1);
    player.addEffect("speed", 160, {
      amplifier,
      showParticles: false,
    });
  } catch (e) {
    console.warn("[Stonecraft] spear speed apply failed", e);
  }
}

// 移除由本模块管理的速度效果
function removeSpearSpeed(player) {
  try {
    if (getOrZero(player, "stonecraft:dash_managed", 0) === 1) {
      player.removeEffect("speed");
      player.setDynamicProperty("stonecraft:dash_managed", 0);
    }
  } catch (e) {
    console.warn("[Stonecraft] spear speed remove failed", e);
  }
}

export function initSpearEffects() {
  // 开始使用物品（举矛）
  world.afterEvents.itemStartUse.subscribe((event) => {
    try {
      const player = event.source;
      if (!player || player.typeId !== "minecraft:player") return;
      const item = event.itemStack ?? getMainHandItem(player);
      if (!isSpearItem(item)) return;
      const level = getSpearSpeedLevel(player);
      if (level <= 0) return;
      applySpearSpeed(player, level);
    } catch (e) {
      console.warn("[Stonecraft] itemStartUse failed", e);
    }
  });

  // 停止使用物品（放下矛）
  world.afterEvents.itemStopUse.subscribe((event) => {
    try {
      const player = event.source;
      if (!player || player.typeId !== "minecraft:player") return;
      removeSpearSpeed(player);
    } catch (e) {
      console.warn("[Stonecraft] itemStopUse failed", e);
    }
  });

  // 主手切换时移除速度，避免残留
   world.afterEvents.playerHotbarSelectedSlotChange.subscribe((event) => {
    try {
      const player = event.player;
      if (!player) return;
      removeSpearSpeed(player);
    } catch (e) {
      console.warn("[Stonecraft] playerHotbarSelectedSlotChange failed", e);
    }
  });

  // 玩家重生/死亡时清除管理标记
  world.afterEvents.playerSpawn.subscribe((event) => {
    try {
      const player = event.player;
      if (!player) return;
      removeSpearSpeed(player);
    } catch (e) {
      console.warn("[Stonecraft] playerSpawn failed", e);
    }
  });
}