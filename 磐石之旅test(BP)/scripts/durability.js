import { world, ItemDurabilityComponent, EntityEquippableComponent, EquipmentSlot, Player } from "@minecraft/server";

// 统一耐久消耗处理函数
function damageItem(player, item) {
    if (!item) return;
    const durability = item.getComponent(ItemDurabilityComponent.componentId);
    if (!durability) return;

    // 获取耐久附魔等级
    let unbreakingLevel = 0;
    const enchantable = item.getComponent("minecraft:enchantable");
    if (enchantable) {
        const unbreakingEnchant = enchantable.getEnchantment("unbreaking");
        if (unbreakingEnchant) {
            unbreakingLevel = unbreakingEnchant.level;
        }
    }

    // 计算损耗概率（已根据耐久附魔自动调整）
    const chance = durability.getDamageChance(unbreakingLevel);
    if (Math.random() < chance) {
        if (durability.damage >= durability.maxDurability) {
            // 如果已经到达最大耐久，则不再继续施加损伤，避免超出合法范围
            return;
        }
        durability.damage++;
        // 刷新物品槽位，使耐久变化生效
        const equippable = player.getComponent(EntityEquippableComponent.componentId);
        if (equippable) {
            equippable.setEquipment(EquipmentSlot.Mainhand, item);
        }
    }
}

// 挖掘方块时消耗耐久
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const equippable = player.getComponent(EntityEquippableComponent.componentId);
    if (!equippable) return;

    const weapon = equippable.getEquipment(EquipmentSlot.Mainhand);
    // 检查物品是否带有指定标签
    if (weapon && weapon.hasTag("stonecraft:custom_tool")) {
        damageItem(player, weapon);
    }
});
