//StoneAPI —— 工具与方块交互库
// scripts/items/my_tool.js
/*
若要写自己的组件：
import { StoneToolRegistry } from "../lib/stoneapi/index.js";

const anyName = new StoneToolRegistry();
anyName.addComponent("namespace:example");   // ← 名字在这里定义
anyName.register();                               // ← 必须调用
*/
import { world, system, EntityComponentTypes, EquipmentSlot, GameMode } from "@minecraft/server";

export const TOOL_TYPES = {
  axe: {
    sound: "use.wood",
    matches: (typeId) => typeId.includes("stripped"),
  },
  shovel: {
    sound: "use.grass",
    matches: (typeId) => typeId === "minecraft:grass_path" || typeId === "minecraft:dirt_path",
  },
  hoe: {
    sound: "step.gravel",
    matches: (typeId) => typeId === "minecraft:farmland",
  },
  versatile: {
    sound: (typeId) => {
      if (typeId.includes("stripped")) return "use.wood";
      if (typeId === "minecraft:farmland") return "step.gravel";
      return "use.grass";
    },
    matches: (typeId) =>
      typeId.includes("stripped") ||
      typeId === "minecraft:grass_path" ||
      typeId === "minecraft:dirt_path" ||
      typeId === "minecraft:farmland",
  },
};

const registries = [];
let interactionSubscribed = false;

function readComponentType(item, componentId) {
  try {
    const component = item.getComponent(componentId);
    const params = component?.customComponentParameters?.params;
    return typeof params?.type === "string" ? params.type : undefined;
  } catch {
    return undefined;
  }
}

function readHeldItem(player) {
  try {
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    return { equippable, item: equippable?.getEquipment(EquipmentSlot.Mainhand) };
  } catch {
    return {};
  }
}

function consumeDurability(player) {
  if (player.getGameMode() === GameMode.Creative) return;
  try {
    const { equippable, item } = readHeldItem(player);
    const durability = item?.getComponent("minecraft:durability");
    if (!durability || durability.damage >= durability.maxDurability) return;
    durability.damage += 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, item);
  } catch {}
}

function resolveType(item) {
  for (const registry of registries) {
    const fromComponent = registry.resolveComponentType(item);
    if (fromComponent) return { type: fromComponent, registry };
    const fromTag = registry.resolveTagType(item);
    if (fromTag) return { type: fromTag, registry };
  }
  return {};
}

function subscribeInteraction() {
  if (interactionSubscribed) return;
  interactionSubscribed = true;

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block } = event;
    if (!player || !block) return;

    const { item } = readHeldItem(player);
    if (!item) return;

    const { type, registry } = resolveType(item);
    const def = type ? TOOL_TYPES[type] : undefined;
    if (!def || !registry) return;

    const beforeTypeId = block.typeId;
    const dimension = block.dimension;
    const { x, y, z } = block;

    system.run(() => {
      const afterTypeId = dimension.getBlock({ x, y, z })?.typeId;
      if (!afterTypeId || afterTypeId === beforeTypeId) return;
      if (!def.matches(afterTypeId)) return;

      const sound = typeof def.sound === "function" ? def.sound(afterTypeId) : def.sound;
      dimension.playSound(sound, { x, y, z });
      consumeDurability(player);

      const hook = registry.getHook(type);
      if (hook) {
        try {
          hook(player, block, afterTypeId);
        } catch (error) {
          console.error("[StoneAPI] tool hook failed:", error);
        }
      }
    });
  });
}

export class StoneToolRegistry {
  constructor() {
    this.componentIds = new Set();
    this.tagTypes = new Map();
    this.hooks = {};
    this.registered = false;
  }

  addComponent(componentId) {
    if (typeof componentId === "string" && componentId) this.componentIds.add(componentId);
    return this;
  }

  addTag(tag, type) {
    if (typeof tag === "string" && typeof type === "string") this.tagTypes.set(tag, type);
    return this;
  }

  on(type, hook) {
    if (typeof type === "string" && typeof hook === "function") this.hooks[type] = hook;
    return this;
  }

  getHook(type) {
    return this.hooks[type];
  }

  resolveComponentType(item) {
    for (const componentId of this.componentIds) {
      const type = readComponentType(item, componentId);
      if (type) return type;
    }
    return undefined;
  }

  resolveTagType(item) {
    for (const [tag, type] of this.tagTypes) {
      try {
        if (item.hasTag(tag)) return type;
      } catch {}
    }
    return undefined;
  }

  register() {
    if (this.registered) return this;
    this.registered = true;
    registries.push(this);

    if (this.componentIds.size > 0) {
      const ids = [...this.componentIds];
      try {
        system.beforeEvents.startup.subscribe((event) => {
          const itemRegistry = event?.itemComponentRegistry;
          if (!itemRegistry) return;
          for (const componentId of ids) {
            try {
              itemRegistry.registerCustomComponent(componentId, {});
            } catch (error) {
              console.error(`[StoneAPI] register ${componentId} failed:`, error);
            }
          }
        });
      } catch (error) {
        console.error("[StoneAPI] startup hook failed:", error);
      }
    }

    subscribeInteraction();
    return this;
  }
}

export function getRegisteredToolTypes() {
  return Object.keys(TOOL_TYPES);
}
