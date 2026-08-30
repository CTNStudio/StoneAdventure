//血祭自己
import { world, Player, EquipmentSlot, ItemStack  } from "@minecraft/server";

const firstHandId = "stonecraft:sacrificial_blade";
const inventoryHeldId = "minecraft:glass_bottle";
function findItemSlot(player, itemId) {
    const container = player.getComponent("inventory").container;
    if (!container) return -1;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId === itemId) {
            return i;
        }
    }
    return -1;
}

world.afterEvents.itemUse.subscribe((event) => {
    const { source, itemStack } = event;
    if (!source || source.typeId !== 'minecraft:player') return;

    if (itemStack.typeId === firstHandId) {
        const slot = findItemSlot(source, inventoryHeldId);

        if (slot !== -1) {
            const container = source.getComponent("inventory").container;
            const item = container.getItem(slot);

            if (item) {
                if (item.amount > 1) {
                    item.amount -= 1;
                    container.setItem(slot, item);
                } else {
                    container.setItem(slot, undefined);
                }
            }
            source.getComponent("equippable").setEquipment(EquipmentSlot.Mainhand, new ItemStack("stonecraft:blood_bottle", 1));
            source.applyDamage(10);
            source.playSound("random.break");
            source.playSound("stonecraft.poured_into_the_bottle");
        }
    }
});