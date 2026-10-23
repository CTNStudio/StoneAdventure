//StoneAPI —— 方块交互模块（矿石经验 / 可交互方块）
//设计要点：每个功能独立判断，方块 JSON 缺少任何参数都不影响其它功能触发：
//  缺少 loot_table -> 只跳过掉落，经验照发
//  缺少 tier       -> 不限制工具等级
//  缺少 exp        -> 只做掉落/回调
//用法（可分散在多个脚本，组件名自定）：
//    const blocks = new BlockRegistry();
//    blocks.add(new OreBlock("stonecraft:my_ore"));
//    blocks.add(new InteractableBlock("stonecraft:my_door"));
//    blocks.register();
import {
  system,
  GameMode,
  EntityComponentTypes,
  EquipmentSlot,
} from "@minecraft/server";

//vanilla 等级顺序（从低到高），用于"至少 X 级"判定
const VANILLA_TIERS = [
  "minecraft:wooden_tier",
  "minecraft:golden_tier",
  "minecraft:stone_tier",
  "minecraft:iron_tier",
  "minecraft:diamond_tier",
  "minecraft:netherite_tier",
];

const TIER_NAME_TO_TAG = {
  wooden: "minecraft:wooden_tier",
  wood: "minecraft:wooden_tier",
  golden: "minecraft:golden_tier",
  gold: "minecraft:golden_tier",
  stone: "minecraft:stone_tier",
  iron: "minecraft:iron_tier",
  diamond: "minecraft:diamond_tier",
  netherite: "minecraft:netherite_tier",
};

function safeCall(fn, ...args) {
  if (typeof fn !== "function") return;
  try {
    fn(...args);
  } catch (error) {
    console.error("[StoneAPI] block hook failed:", error);
  }
}

function getItemTags(item) {
  try {
    return item.getTags();
  } catch {
    return [];
  }
}

function getEquipmentItem(entity, slot = EquipmentSlot.Mainhand) {
  try {
    return entity?.getComponent(EntityComponentTypes.Equippable)?.getEquipment(slot);
  } catch {
    return undefined;
  }
}

/**
 * 判断物品是否满足等级要求。
 * tier 支持三种写法：
 *   "diamond"                      → 至少钻石级（按 vanilla 等级顺序）
 *   "stonecraft:lv3_tier"          → 直接按标签匹配（任意命名空间）
 *   ["minecraft:diamond_tier", ...] → 满足其中任意一个即可
 * 未提供 tier（或写空字符串/空数组）时一律通过。
 */
export function meetsTier(item, tier) {
  const wanted = (Array.isArray(tier) ? tier : [tier]).filter(
    (entry) => typeof entry === "string" && entry.length > 0
  );
  //未填 = 不限制
  if (wanted.length === 0) return true;
  if (!item) return false;

  const tags = getItemTags(item);

  return wanted.some((entry) => {
    //带命名空间的一律当标签处理
    if (entry.includes(":")) return tags.includes(entry);

    const tag = TIER_NAME_TO_TAG[entry.toLowerCase()];
    if (!tag) return false;
    const required = VANILLA_TIERS.indexOf(tag);
    if (required < 0) return false;

    //取该物品实际达到的最高 vanilla 等级
    let owned = -1;
    for (let i = 0; i < VANILLA_TIERS.length; i++) {
      if (tags.includes(VANILLA_TIERS[i])) owned = Math.max(owned, i);
    }
    return owned >= required;
  });
}

function spawnLoot(dimension, location, lootTable, toolType) {
  if (!lootTable) return;
  const base = `loot spawn ${location.x} ${location.y} ${location.z} loot "${lootTable}"`;
  const command = toolType ? `${base} "${toolType}"` : base;
  try {
    dimension.runCommand(command);
  } catch (error) {
    //掉落表路径非法时只记录，不影响经验等其它功能
    console.error(`[StoneAPI] loot failed (${lootTable}):`, error);
  }
}

/** 单个方块最多生成的经验球实体数，超出部分直接补发给玩家（避免刷实体） */
const MAX_XP_ORB_ENTITIES = 50;

/** 直接生成等量的 minecraft:xp_orb 实体（每个 1 点经验） */
function spawnOrbEntities(callback, player, amount) {
  const base = callback.block.location;
  const location = { x: base.x + 0.5, y: base.y + 0.5, z: base.z + 0.5 };

  const target = Math.min(amount, MAX_XP_ORB_ENTITIES);
  let spawned = 0;
  for (let i = 0; i < target; i++) {
    try {
      callback.dimension.spawnEntity("minecraft:xp_orb", location);
      spawned++;
    } catch (error) {
      console.error("[StoneAPI] spawn xp_orb failed:", error);
      break;
    }
  }

  const rest = amount - spawned;
  if (rest > 0) {
    try {
      player.addExperience(rest);
    } catch (error) {
      console.error("[StoneAPI] addExperience failed:", error);
    }
  }
}

function spawnXpOrbs(callback, player, exp) {
  const amount = Math.max(1, Math.min(12000, Math.floor(exp)));
  const base = callback.block.location;
  const location = { x: base.x + 0.5, y: base.y + 0.5, z: base.z + 0.5 };

  if (typeof callback.dimension.spawnXp === "function") {
    try {
      callback.dimension.spawnXp(location, amount);
      return;
    } catch (error) {
      console.error("[StoneAPI] spawnXp failed, fallback to xp_orb entities:", error);
    }
  }

  spawnOrbEntities(callback, player, amount);
}

export class OreBlock {
  /** @param {string} name 组件名，会注册为自定义方块组件 */
  constructor(name) {
    this.name = name;
    this.onBreak = undefined;
  }
}

export class InteractableBlock {
  /** @param {string} name 组件名，会注册为自定义方块组件 */
  constructor(name) {
    this.name = name;
    this.onInteract = undefined;
  }
}

const registeredComponents = new Set();

export class BlockRegistry {
  constructor() {
    this.blocks = new Map();
    this.registered = false;
  }

  add(block) {
    if (Array.isArray(block)) {
      block.forEach((value) => this.blocks.set(value.name, value));
      return this;
    }
    this.blocks.set(block.name, block);
    return this;
  }

  register() {
    if (this.registered) return this;
    this.registered = true;

    const oreBlocks = [...this.blocks.values()].filter((b) => b instanceof OreBlock);
    const interactableBlocks = [...this.blocks.values()].filter((b) => b instanceof InteractableBlock);

    system.beforeEvents.startup.subscribe((event) => {
      const registry = event?.blockComponentRegistry;
      if (!registry) return;

      for (const block of oreBlocks) {
        registeredComponents.add(block.name);
        registry.registerCustomComponent(block.name, {
          onPlayerBreak(callback, param) {
            const player = callback.player;
            if (!player) return;

            //① 自定义回调最先执行，且不受后面任何条件影响
            safeCall(block.onBreak, callback);

            //② 创造模式：按原版行为，不产出掉落、不给经验
            if (player.getGameMode() === GameMode.Creative) return;

            const data = param?.params ?? {};

            //③ 工具要求（缺省则不限制）：require_tag 与 tier 任一不满足即跳过掉落与经验
            if (data.require_tag) {
              const item = getEquipmentItem(player);
              if (!item || !getItemTags(item).includes(data.require_tag)) return;
            }
            if (!meetsTier(getEquipmentItem(player), data.tier)) return;

            //④ 掉落与经验各自独立：缺一个不影响另一个
            spawnLoot(callback.dimension, callback.block.location, data.loot_table);
            if (data.exp) spawnXpOrbs(callback, player, data.exp);
          },
        });
      }

      for (const block of interactableBlocks) {
        registeredComponents.add(block.name);
        registry.registerCustomComponent(block.name, {
          onPlayerInteract(callback) {
            safeCall(block.onInteract, callback);
          },
        });
      }
    });

    return this;
  }
}

export function getRegisteredBlockComponents() {
  return [...registeredComponents];
}
