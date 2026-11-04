import {
    world,
    system,
    Player,
    EquipmentSlot
} from "@minecraft/server";

system.beforeEvents.startup.subscribe(({
    itemComponentRegistry
}) => {
    itemComponentRegistry.registerCustomComponent("xy:toughness", {});
});

const DEFAULT_TOUGHNESS = {
    "minecraft:diamond_helmet": 2,
    "minecraft:diamond_chestplate": 2,
    "minecraft:diamond_leggings": 2,
    "minecraft:diamond_boots": 2,
    "minecraft:netherite_helmet": 3,
    "minecraft:netherite_chestplate": 3,
    "minecraft:netherite_leggings": 3,
    "minecraft:netherite_boots": 3,
};

function getCustomToughness(item) {
    if (!item) return 0;
    try {
        const comp = item.getComponent("xy:toughness");
        if (!comp) return 0;
        const params = comp.customComponentParameters;
        if (params && typeof params === 'object') {
            if (typeof params.value === 'number') return params.value;
            if (params.params !== undefined) {
                if (typeof params.params === 'object') {
                    if (typeof params.params.value === 'number') return params.params.value;
                } else if (typeof params.params === 'string') {
                    try {
                        const parsed = JSON.parse(params.params);
                        if (parsed && typeof parsed.value === 'number') return parsed.value;
                    } catch (e) {}
                }
            }
            if (typeof params === 'string') {
                try {
                    const parsed = JSON.parse(params);
                    if (parsed && typeof parsed.value === 'number') return parsed.value;
                } catch (e) {}
            }
        }
        if (typeof comp.value === 'number') return comp.value;
    } catch (e) {}
    return 0;
}

function getOriginalToughness(item) {
    if (!item) return 0;
    return DEFAULT_TOUGHNESS[item.typeId] || 0;
}

const LORE_LANGS = {
    "zh_CN": (v) => `§r§9+${v} 盔甲韧性`,
    "zh_TW": (v) => `§r§9+${v} 盔甲強度`,
    "en_US": (v) => `§r§9+${v} Armor Toughness`,
    "ja_JP": (v) => `§r§9+${v} 防具強度`,
    "vi_VN": (v) => `§r§9+${v} Độ bền áo giáp`,
};

const LORE_MARKERS = [
    "盔甲韧性", "盔甲強度", "防具強度", "Armor Toughness", "Độ bền áo giáp"
];

function resolveLocale(player) {
    try {
        const raw = player?.clientSystemInfo?.locale;
        if (typeof raw === "string" && raw) {
            if (LORE_LANGS[raw]) return raw;
            const lower = raw.toLowerCase();
            for (const key of Object.keys(LORE_LANGS))
                if (key.toLowerCase() === lower) return key;
            const lang = lower.split(/[_-]/)[0];
            for (const key of Object.keys(LORE_LANGS))
                if (key.toLowerCase().startsWith(lang + "_")) return key;
        }
    } catch (e) {}
    return "zh_CN";
}

function makeToughnessLoreLine(toughness, player) {
    const fn = LORE_LANGS[resolveLocale(player)] || LORE_LANGS.zh_CN;
    return fn(toughness);
}

function loreHasToughness(line) {
    return typeof line === "string" && LORE_MARKERS.some((m) => line.includes(m));
}

function updateItemLoreWithToughness(item, player) {
    if (!item) return false;
    try {
        const toughness = getCustomToughness(item);
        if (toughness === 0) return false;

        const lore = item.getLore();
        const expected = makeToughnessLoreLine(toughness, player);

        if (lore.length > 0 && lore[0] === expected) return false;

        const otherLore = lore.filter((line) => !loreHasToughness(line));
        item.setLore([expected, ...otherLore]);
        return true;
    } catch (e) {}
    return false;
}

system.runInterval(() => {
    try {
        const players = world.getAllPlayers();
        for (const player of players) {
            const inventory = player.getComponent("inventory");
            if (inventory?.container) {
                const container = inventory.container;
                for (let slot = 0; slot < container.size; slot++) {
                    try {
                        const item = container.getItem(slot);
                        if (item && updateItemLoreWithToughness(item, player)) {
                            container.setItem(slot, item);
                        }
                    } catch (e) {}
                }
            }
            const equippable = player.getComponent("equippable");
            if (equippable) {
                const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
                for (const slot of slots) {
                    try {
                        const item = equippable.getEquipment(slot);
                        if (item && updateItemLoreWithToughness(item, player)) {
                            if (typeof equippable.setEquipment === 'function') {
                                equippable.setEquipment(slot, item);
                            }
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (e) {}
}, 20);

function getPlayerArmorStats(player) {
    const equippable = player.getComponent("equippable");
    if (!equippable) return {
        totalArmor: 0,
        totalOriginalToughness: 0,
        totalCustomToughness: 0
    };

    const totalArmor = equippable.totalArmor || 0;
    const totalOriginalToughness = equippable.totalToughness || 0;

    let totalCustomToughness = 0;
    const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
    for (const slot of slots) {
        const item = equippable.getEquipment(slot);
        if (item) {
            totalCustomToughness += getCustomToughness(item);
        }
    }
    return {
        totalArmor,
        totalOriginalToughness,
        totalCustomToughness
    };
}

function getResistanceLevel(player) {
    const effect = player.getEffect("resistance");
    return effect ? effect.amplifier + 1 : 0;
}

function getProtectionReduction(player, damageCause) {
    let total = 0;
    const equippable = player.getComponent("equippable");
    if (!equippable) return 0;
    const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
    for (const slot of slots) {
        const item = equippable.getEquipment(slot);
        if (!item) continue;

        // 基岩版正确读取附魔：先取 enchantable 组件，再 getEnchantments()
        let enchantments = [];
        try {
            const enchantable = item.getComponent("enchantable");
            if (enchantable && typeof enchantable.getEnchantments === "function") {
                enchantments = enchantable.getEnchantments() || [];
            }
        } catch (e) {}
        if (enchantments.length === 0) continue;

        for (const ench of enchantments) {
            const id = ench.type.id; // 不带 minecraft: 前缀
            const level = ench.level;
            if (id === "protection") {
                total += level * 0.04;
            } else if (damageCause === "projectile" && id === "projectile_protection") {
                total += level * 0.08;
            } else if ((damageCause === "entityExplosion" || damageCause === "blockExplosion") && id === "blast_protection") {
                total += level * 0.08;
            }
        }
    }
    return Math.min(total, 0.8);
}

function reverseArmor(dAfterArmor, armor, toughness) {
    const k = 0.5 + 0.0625 * toughness;
    const rTheory = 0.04 * armor;
    const rMin = 0.008 * armor;
    const rMax = 0.8;

    const upperBound = (rTheory - rMax) * 100 * k;
    if (rTheory > rMax && upperBound >= 0) {
        const d0Try = dAfterArmor / (1 - rMax);
        if (d0Try <= upperBound + 1e-7) return d0Try;
    }

    const lowerBound = (rTheory - rMin) * 100 * k;
    if (lowerBound >= 0) {
        const d0Try = dAfterArmor / (1 - rMin);
        if (d0Try >= lowerBound - 1e-7) return d0Try;
    }

    const A = 1 / (100 * k);
    const B = 1 - rTheory;
    const C = -dAfterArmor;
    const discriminant = B * B - 4 * A * C;
    if (discriminant < 0) return dAfterArmor / (1 - (rTheory + rMin) / 2);
    const sqrtD = Math.sqrt(discriminant);
    let d0 = (-B + sqrtD) / (2 * A);
    if (d0 < 0) d0 = (-B - sqrtD) / (2 * A);
    const lower = (rTheory - rMax) * 100 * k;
    const upper = (rTheory - rMin) * 100 * k;
    if (d0 > lower - 1e-5 && d0 < upper + 1e-5) return d0;
    if (d0 <= lower) return dAfterArmor / (1 - rMax);
    if (d0 >= upper) return dAfterArmor / (1 - rMin);
    return d0;
}

function computeNewDamage(originalDamage, armor, toughness, resistanceLevel, enchReduction) {
    const k = 0.5 + 0.0625 * toughness;
    const rTheory = 0.04 * armor;
    const rMin = 0.008 * armor;
    const rMax = 0.8;
    let reduction = rTheory - originalDamage / (100 * k);
    reduction = Math.min(Math.max(reduction, rMin), rMax);
    const afterArmor = originalDamage * (1 - reduction);
    const afterEnch = afterArmor * (1 - enchReduction);
    const afterRes = afterEnch * (1 - 0.2 * resistanceLevel);
    return Math.max(afterRes, 0);
}

// 基岩版 EntityDamageCause 使用驼峰式，无下划线
const EXCLUDED_CAUSES = [
    "lava", "fire", "fireTick", "suffocation", "drowning", "starve", "void", "magic",
    "wither", "fall",
    "selfDestruct",
    "override",
    "sonicBoom",
    "fallingBlock",
    "flyIntoWall",
    "stalagmite", "stalactite",
    "magma"
];

world.beforeEvents.entityHurt.subscribe((event) => {
    const {
        hurtEntity,
        damage,
        damageSource
    } = event;
    if (!(hurtEntity instanceof Player)) return;

    const cause = damageSource.cause;
    if (EXCLUDED_CAUSES.includes(cause)) return;

    const {
        totalArmor,
        totalOriginalToughness,
        totalCustomToughness
    } = getPlayerArmorStats(hurtEntity);

    if (totalCustomToughness <= 0) return;

    const resistanceLvl = getResistanceLevel(hurtEntity);
    const enchReduction = getProtectionReduction(hurtEntity, cause);

    let afterResistance = damage;
    if (resistanceLvl > 0) {
        const resistFactor = 1 - 0.2 * resistanceLvl;
        if (resistFactor <= 0) {
            event.cancel = true;
            return;
        }
        afterResistance /= resistFactor;
    }
    if (enchReduction >= 1) {
        event.cancel = true;
        return;
    }
    const afterEnchant = afterResistance / (1 - enchReduction);

    const originalDamage = reverseArmor(afterEnchant, totalArmor, totalOriginalToughness);

    const totalToughness = totalOriginalToughness + totalCustomToughness;
    let newDamage = computeNewDamage(originalDamage, totalArmor, totalToughness, resistanceLvl, enchReduction);
    newDamage = Math.max(newDamage, 0);

    if (newDamage <= 0) {
        event.cancel = true;
    } else {
        event.damage = newDamage;
    }
});

world.afterEvents.playerEmote.subscribe((event) => {
    try {
        const player = event.player;
        if (!player) return;
        if (event.personaPieceId === "9a469a61-c83b-4ba9-b507-bdbe64430582") {
            const {
                totalArmor,
                totalOriginalToughness,
                totalCustomToughness
            } = getPlayerArmorStats(player);
            const totalToughness = totalOriginalToughness + totalCustomToughness;
            player.sendMessage(`§a[盔甲状态] §f护甲值: §e${totalArmor} §f| 韧性: §b${totalToughness}`);
        }
    } catch (e) {}
});