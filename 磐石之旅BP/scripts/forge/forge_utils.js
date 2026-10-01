//底层工具库与数据定义中心
import {
    EquipmentSlot,
    EntityComponentTypes,
    ItemStack,
} from "@minecraft/server";
import InventoryUtil from "../utils/InventoryUtil.js";

export const ATTRIBUTE_DEFS = [
    {
        id: "wither",
        key: "stonecraft:wither_level",
        playerKey: "stonecraft:wither",
        loreText: "§0凋零",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "blindness",
        key: "stonecraft:blindness_level",
        playerKey: "stonecraft:blindness",
        loreText: "§5失明",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "regeneration",
        key: "stonecraft:regeneration_level",
        playerKey: "stonecraft:regeneration",
        loreText: "§a再生",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "cleansing",
        key: "stonecraft:cleansing_level",
        playerKey: "stonecraft:cleansing",
        loreText: "§b净化",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "stun",
        key: "stonecraft:stun_level",
        playerKey: "stonecraft:stun",
        loreText: "§8震击",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "battle_fury",
        key: "stonecraft:battle_fury_level",
        playerKey: "stonecraft:battle_fury",
        loreText: "§c战意",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "concuss",
        key: "stonecraft:concuss_level",
        playerKey: "stonecraft:concuss",
        loreText: "§8昏眩",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "resistance",
        key: "stonecraft:resistance_level",
        playerKey: "stonecraft:resistance",
        loreText: "§7抗性",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "health_boost",
        key: "stonecraft:health_boost_level",
        playerKey: "stonecraft:health_boost",
        loreText: "§a生机",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "night_vision",
        key: "stonecraft:night_vision_level",
        playerKey: "stonecraft:night_vision",
        loreText: "§9夜视",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "fire_resistance",
        key: "stonecraft:fire_resistance_level",
        playerKey: "stonecraft:fire_resistance",
        loreText: "§c抗火",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "bleeding",
        key: "stonecraft:bleeding_level",
        playerKey: "stonecraft:bleeding",
        loreText: "§c失血",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "dash",
        key: "stonecraft:dash_level",
        playerKey: "stonecraft:dash",
        loreText: "§b迅突",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "bulwark",
        key: "stonecraft:bulwark_level",
        playerKey: "stonecraft:bulwark",
        loreText: "§8坚壁",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    },
    {
        id: "accumulate",
        key: "stonecraft:accumulate_level",
        playerKey: "stonecraft:accumulate",
        loreText: "§d积爆",
        beadTagPrefix: "inlaid_essence_bead",
        materialTagPrefix: "forge",
    }
];

export function extractTagSuffix(tag, prefix) {
    if (typeof tag !== "string") return "";
    const base = `${prefix}_`;
    if (!tag.startsWith(base)) return "";
    return tag.slice(base.length);
}

export function getMainHandItem(player) {
    return InventoryUtil.getMainHandItem(player);
}

export function setMainHandItem(player, item) {
    return InventoryUtil.setMainHandItem(player, item);
}

export function giveItem(player, item) {
    return InventoryUtil.giveItem(player, item);
}

export function pushLore(text, item) {
    if (!item) return item;
    try {
        const lore = item.getLore?.() ?? [];
        lore.push(text);
        item.setLore(lore);
    } catch {
    }
    return item;
}

export function getOrZero(target, key, defaultValue = 0) {
    try {
        const value = target?.getDynamicProperty?.(key);
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        if (typeof value === "string" && value !== "") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : defaultValue;
        }
        if (value === undefined || value === null) return defaultValue;
        return defaultValue;
    } catch {
        return defaultValue;
    }
}

export function getAttributeLevel(item, def) {
    if (!item || !def) return 0;
    const level = getOrZero(item, def.key, 0);
    if (level > 0) return level;
    return getOrZero(item, def.playerKey, 0);
}

export function setOrClearDynamicProperty(target, key, value) {
    try {
        if (value === undefined || value === null || value === "") {
            target.setDynamicProperty(key, undefined);
        } else {
            target.setDynamicProperty(key, value);
        }
        return true;
    } catch {
        return false;
    }
}

export function createItem(typeId, amount = 1) {
    try {
        return new ItemStack(typeId, amount);
    } catch {
        return undefined;
    }
}