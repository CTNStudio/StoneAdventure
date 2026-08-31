//激活summoner
import { world, BlockPermutation, system, EntityComponentTypes, EquipmentSlot, ItemStack } from '@minecraft/server';

const KEY_ID = 'stonecraft:blood_offering_vial';
const SUMMONER_ID = 'stonecraft:stone_summoner';
const ACTIVATED_ID = 'stonecraft:stone_summoner_activated';

function consumeMainHandKey(player) {
    system.run(() => {
        try {
            const equip = player.getComponent(EntityComponentTypes.Equippable);
            if (!equip) return;

            const held = equip.getEquipment(EquipmentSlot.Mainhand);
            if (!held || held.typeId !== KEY_ID) return;

            const amount = typeof held.amount === 'number' ? held.amount : (typeof held.count === 'number' ? held.count : 1);
            if (amount > 1) {
                equip.setEquipment(EquipmentSlot.Mainhand, new ItemStack(KEY_ID, amount - 1));
            } else {
                equip.setEquipment(EquipmentSlot.Mainhand, undefined);
            }
        } catch (e) {
            console.error('[stone_key] consume failed', e);
        }
    });
}

function activateSummoner(player, block) {
    if (!player || !block) return;
    if (block.typeId !== SUMMONER_ID) return;

    // 检查手中是否有血瓶
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    const held = equip ? equip.getEquipment(EquipmentSlot.Mainhand) : undefined;
    if (!held || held.typeId !== KEY_ID) return;
    

    const blockLocation = block.location;
    const dimension = block.dimension;

    system.run(() => {
        try {
            player.playSound('stonecraft.sacrificial_blood_infusion');

            const currentBlock = dimension.getBlock(blockLocation);
            if (currentBlock && currentBlock.typeId === SUMMONER_ID) {

                const direction = currentBlock.permutation.getState('minecraft:cardinal_direction');
                
                const activatedPermutation = BlockPermutation.resolve(ACTIVATED_ID, {
                    'minecraft:cardinal_direction': direction
                });
                
                currentBlock.setPermutation(activatedPermutation);
            }

            const inventoryEquip = player.getComponent(EntityComponentTypes.Equippable);
            const inventoryHeld = inventoryEquip ? inventoryEquip.getEquipment(EquipmentSlot.Mainhand) : undefined;
            if (!inventoryHeld || inventoryHeld.typeId !== KEY_ID) return;

            const inventoryAmount = typeof inventoryHeld.amount === 'number' ? inventoryHeld.amount : (typeof inventoryHeld.count === 'number' ? inventoryHeld.count : 1);
            if (inventoryAmount > 1) {
                inventoryEquip.setEquipment(EquipmentSlot.Mainhand, new ItemStack(KEY_ID, inventoryAmount - 1));
            } else {
                inventoryEquip.setEquipment(EquipmentSlot.Mainhand, undefined);
            }
        } catch (err) {
            console.error('[stone_key] setPermutation or consume failed', err);
        }
    });
}


if (world.beforeEvents && world.beforeEvents.itemUseOn && world.beforeEvents.itemUseOn.subscribe) {
    world.beforeEvents.itemUseOn.subscribe((event) => {
        const { source, itemStack, block } = event;
        if (!source || source.typeId !== 'minecraft:player') return;
        if (!itemStack || !block) return;
        if (itemStack.typeId === KEY_ID && block.typeId === SUMMONER_ID) {
            activateSummoner(source, block);
        }
    });
} else if (world.beforeEvents && world.beforeEvents.playerInteractWithBlock && world.beforeEvents.playerInteractWithBlock.subscribe) {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        const { player, block } = event;
        if (!player || !block) return;
        if (block.typeId !== SUMMONER_ID) return;

        const equip = player.getComponent(EntityComponentTypes.Equippable);
        const held = equip ? equip.getEquipment(EquipmentSlot.Mainhand) : undefined;
        if (!held || held.typeId !== KEY_ID) return;

        activateSummoner(player, block);
    });
} else {
    console.error('[stone_key] no compatible use-on event found');
}