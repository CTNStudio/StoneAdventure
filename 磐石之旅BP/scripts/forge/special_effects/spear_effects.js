import {
    world,
    EquipmentSlot,
    EntityComponentTypes,
} from "@minecraft/server";
import { getOrZero } from "../forge_utils.js";
import {
    applyTimedSustainedEffects,
    resetTimedEffectCooldown,
} from "../armor_timed_effects.js";
import InventoryUtil from "../../lib/StoneAPI/InventoryUtil.js";

function getMainHandItem(player) {
    return InventoryUtil.getMainHandItem(player);
}

function isSpearItem(item) {
    if (!item) return false;
    try {
        const tags = item.getTags ? item.getTags() : [];
        return tags.some(tag => tag.startsWith("forge_") && tag.slice(6) === "spear");
    } catch {
        return false;
    }
}

function getSpearSpeedLevel(player) {
    return getOrZero(player, "stonecraft:dash", 0);
}

function applySpearSpeed(player, level) {
    if (level <= 0) return;
    const amplifier = Math.min(Math.max(level, 0), 5);
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

function removeSpearSpeed(player) {
    try {
        if (getOrZero(player, "stonecraft:dash_managed", 0) !== 1) return;
        player.setDynamicProperty("stonecraft:dash_managed", 0);

        //迅突和「迅捷」共用同一个 speed 效果：先摘掉迅突这一份，再清掉 CD 让定时系统
        //按护甲等级立刻恢复，避免带着迅捷靴收回长矛时把靴子的效果一起删掉（旧版要等满一个 CD）
        try { player.removeEffect("speed"); } catch {}
        resetTimedEffectCooldown(player, "speed");
        applyTimedSustainedEffects(player);
    } catch (e) {
        console.warn("[Stonecraft] spear speed remove failed", e);
    }
}

let spearEffectsInitialized = false;

export function initSpearEffects() {
    if (spearEffectsInitialized) return;
    spearEffectsInitialized = true;

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

    world.afterEvents.itemStopUse.subscribe((event) => {
        try {
            const player = event.source;
            if (!player || player.typeId !== "minecraft:player") return;
            removeSpearSpeed(player);
        } catch (e) {
            console.warn("[Stonecraft] itemStopUse failed", e);
        }
    });

    world.afterEvents.playerHotbarSelectedSlotChange.subscribe((event) => {
        try {
            const player = event.player;
            if (!player) return;
            removeSpearSpeed(player);
        } catch (e) {
            console.warn("[Stonecraft] playerHotbarSelectedSlotChange failed", e);
        }
    });

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