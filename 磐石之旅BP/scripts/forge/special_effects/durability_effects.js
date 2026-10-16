//装备耐久回复：回锋（武器通用）/ 凝甲（护甲通用）
//带词条的装备每 5 秒回复自身耐久，回复量 = 该装备自身的词条等级（1~3）。
//每件装备各修各的，互不叠加；修复原语与 doll.js 一致：
//改 ItemDurabilityComponent.damage 后必须把物品写回槽位才会生效。
import {
  system,
  world,
  EquipmentSlot,
} from "@minecraft/server";

import { getOrZero } from "../forge_utils.js";

const REPAIR_LEVEL_KEYS = [
  "stonecraft:return_blade_level",
  "stonecraft:coagulate_armor_level",
];

//5 秒 = 100 tick
const REPAIR_INTERVAL_TICKS = 100;

//扫描槽位：主手 + 副手 + 四件护甲
const SCAN_SLOTS = [
  EquipmentSlot.Mainhand,
  EquipmentSlot.Offhand,
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
];

//取该装备自身的回复等级
function getRepairLevel(item) {
  let level = 0;
  for (const key of REPAIR_LEVEL_KEYS) {
    const value = getOrZero(item, key, 0);
    if (value > level) level = value;
  }
  return level;
}

//修复单件装备；无需修复时返回 undefined
function repairItem(item) {
  if (!item) return undefined;

  const level = getRepairLevel(item);
  if (level <= 0) return undefined;

  let durability;
  try {
    durability = item.getComponent("minecraft:durability");
  } catch {
    return undefined;
  }
  if (!durability) return undefined;
  //耐久已满：不产生无意义的槽位写入
  if (durability.damage <= 0) return undefined;

  try {
    durability.damage = Math.max(0, durability.damage - level);
  } catch {
    return undefined;
  }
  return item;
}

function repairPlayerEquipment(player) {
  let equippable;
  try {
    equippable = player.getComponent("minecraft:equippable");
  } catch {
    return;
  }
  if (!equippable) return;

  for (const slot of SCAN_SLOTS) {
    try {
      const item = equippable.getEquipment(slot);
      const repaired = repairItem(item);
      if (repaired) {
        equippable.setEquipment(slot, repaired);
      }
    } catch {
      //单个槽位失败不影响其它槽位
    }
  }
}

export function initDurabilityEffects() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        repairPlayerEquipment(player);
      } catch {}
    }
  }, REPAIR_INTERVAL_TICKS);
}
