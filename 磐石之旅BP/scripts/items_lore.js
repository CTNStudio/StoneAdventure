import { world, system } from '@minecraft/server';
const ITEM_LORE_CONFIG = {
    'stonecraft:expansion_slab': [
        { translate: 'stonecraft.expansion_slab' },
        { translate: 'stonecraft.expansion_slab_lore' }
    ],
    'stonecraft:inlaid_essence_bead_battle_fury': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.battle_fury_lore' }
    ],
    'stonecraft:inlaid_essence_bead_blindness': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.blindness_lore' }
    ],
    'stonecraft:inlaid_essence_bead_cleansing': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.cleansing_lore' }
    ],
    'stonecraft:inlaid_essence_bead_concuss': [
        { translate: 'stonecraft.hammer_only' },
        { translate: 'stonecraft.concuss_lore' }
    ],
    'stonecraft:inlaid_essence_bead_health_boost': [
        { translate: 'stonecraft.armor_only' },
        { translate: 'stonecraft.health_boost_lore' }
    ],
    'stonecraft:inlaid_essence_bead_night_vision': [
        { translate: 'stonecraft.armor_only' },
        { translate: 'stonecraft.night_vision_lore' }
    ],
    'stonecraft:inlaid_essence_bead_regeneration': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.regeneration_lore' }
    ],
    'stonecraft:inlaid_essence_bead_resistance': [
        { translate: 'stonecraft.armor_only' },
        { translate: 'stonecraft.resistance_lore' }
    ],
    'stonecraft:inlaid_essence_bead_stun': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.stun_lore' }
    ],
    'stonecraft:inlaid_essence_bead_wither': [
        { translate: 'stonecraft.weapon_only' },
        { translate: 'stonecraft.wither_lore' }
    ],
};

function isLoreEqual(currentLore, expectedLore) {
    if (currentLore.length !== expectedLore.length) {
        return false;
    }
    for (let i = 0; i < expectedLore.length; i++) {

        if (
            JSON.stringify(currentLore[i]) !==
            JSON.stringify(expectedLore[i])
        ) {
            return false;
        }

    }
    return true;
}
/**
 *
 * @param {ItemStack} item
 * @returns {boolean}
 * true  = Lore 已经修改
 * false = 不需要修改
 */
function updateItemLore(item) {

    if (!item) {
        return false;
    }
    const expectedLore = ITEM_LORE_CONFIG[item.typeId];
    if (!expectedLore) {
        return false;
    }
    const currentLore = item.getLore();
    if (isLoreEqual(currentLore, expectedLore)) {
        return false;
    }
    item.setLore(expectedLore);
    return true;
}

function updateInventory(player) {
    const inventory =
        player
            .getComponent('minecraft:inventory')
            ?.container;
    if (!inventory) {
        return;
    }
    for (let slot = 0; slot < inventory.size; slot++) {
        const item = inventory.getItem(slot);
        if (!item) {
            continue;
        }
        if (!updateItemLore(item)) {
            continue;
        }
        inventory.setItem(slot, item);
    }
}

function updateEquipment(player) {

    const equippable =
        player.getComponent('minecraft:equippable');

    if (!equippable) {
        return;
    }

    const slots = [
        'Head',
        'Chest',
        'Legs',
        'Feet',
        'Offhand'
    ];

    for (const slot of slots) {

        const item = equippable.getEquipment(slot);

        if (!item) {
            continue;
        }

        if (!updateItemLore(item)) {
            continue;
        }

        equippable.setEquipment(slot, item);
    }
}

function updatePlayerItems(player) {

    if (!player) {
        return;
    }

    updateInventory(player);
    updateEquipment(player);
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {

    system.run(() => {
        updatePlayerItems(player);
    });

});

if (world.afterEvents.playerInventoryItemChange?.subscribe) {

    world.afterEvents.playerInventoryItemChange.subscribe(({ player }) => {

        updateInventory(player);

    });

}

if (world.afterEvents.itemPickup?.subscribe) {

    world.afterEvents.itemPickup.subscribe(({ player, itemStack }) => {

        if (!player || !itemStack) {
            return;
        }
        if (!ITEM_LORE_CONFIG[itemStack.typeId]) {
            return;
        }
        system.run(() => {
            updateInventory(player);
        });

    });

}
/*
system.runInterval(() => {

    for (const player of world.getAllPlayers()) {
        updatePlayerItems(player);
    }

}, 10);*/