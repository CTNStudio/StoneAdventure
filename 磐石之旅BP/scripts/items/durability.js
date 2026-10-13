import {
    world,
    GameMode,
    ItemDurabilityComponent,
    EntityEquippableComponent,
    EquipmentSlot
} from "@minecraft/server";

//受本脚本管理的物品标签：工具类与武器类。
//原版对这些自定义物品挖掘方块不扣耐久（官方原因），因此由本脚本补上这一扣。
//弓与弹弓刻意不含在内：原版弓挖掘方块本就不消耗耐久，无需补扣。
const MANAGED_TAGS = [
    "stonecraft:custom_tool",
    "stonecraft:custom_weapon"
];

//挖方块扣量：剑 2 点，其余受管物品 1 点（对齐原版速率）
const SWORD_TAG = "stonecraft:sword";
const SWORD_BREAK_COST = 2;
const DEFAULT_BREAK_COST = 1;

function isManaged(item) {
    if (!item) return false;
    try {
        return MANAGED_TAGS.some((tag) => item.hasTag(tag));
    } catch {
        return false;
    }
}

function getBreakCost(item) {
    try {
        return item.hasTag(SWORD_TAG) ? SWORD_BREAK_COST : DEFAULT_BREAK_COST;
    } catch {
        return DEFAULT_BREAK_COST;
    }
}

function damageItem(player, item, amount) {
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

    //+耐久：先掷一次是否消耗，再一次性扣掉本次的完整损耗量（与 Java 的 damageItem(2) 语义一致）
    const chance = durability.getDamageChance(unbreakingLevel) / 100;
    if (Math.random() >= chance) return;

    const equippable = player.getComponent(EntityEquippableComponent.componentId);
    if (!equippable) return;

    if (durability.damage + amount >= durability.maxDurability) {
        equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
        player.playSound("random.break");
        return;
    }

    durability.damage += amount;
    equippable.setEquipment(EquipmentSlot.Mainhand, item);
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const equippable = player.getComponent(EntityEquippableComponent.componentId);
    if (!equippable) return;

    const weapon = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (isManaged(weapon)) {
        damageItem(player, weapon, getBreakCost(weapon));
    }
});
