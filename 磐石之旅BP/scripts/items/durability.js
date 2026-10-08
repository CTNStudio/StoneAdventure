import {
    world,
    GameMode,
    ItemDurabilityComponent,
    EntityEquippableComponent,
    EquipmentSlot
} from "@minecraft/server";

function damageItem(player, item) {
    if (!item) return;

    if (player.getGameMode() === GameMode.Creative) return;

    const durability = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durability) return;

    let unbreakingLevel = 0;
    const enchantable = item.getComponent("minecraft:enchantable");
    if (enchantable) {
        const unbreakingEnchant = enchantable.getEnchantment("unbreaking");
        if (unbreakingEnchant) {
            unbreakingLevel = unbreakingEnchant.level;
        }
    }

    const chance = durability.getDamageChance(unbreakingLevel) / 100;
    if (Math.random() >= chance) return;

    const equippable = player.getComponent(EntityEquippableComponent.componentId);
    if (!equippable) return;

    if (durability.damage + 1 >= durability.maxDurability) {
        equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
        player.playSound("random.break");
        return;
    }

    durability.damage++;
    equippable.setEquipment(EquipmentSlot.Mainhand, item);
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const equippable = player.getComponent(EntityEquippableComponent.componentId);
    if (!equippable) return;

    const weapon = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (weapon && weapon.hasTag("stonecraft:custom_tool")) {
        damageItem(player, weapon);
    }
});