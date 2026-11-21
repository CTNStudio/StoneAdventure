export const weekly_pool = [
    {
        id: "weekly_kill_guard",
        title: { translate: "sc.weekly.kill_guard.title" },
        description: { translate: "sc.weekly.kill_guard.body" },
        condition: { killEntity: { entityType: "stonecraft:stone_guard", amount: 20, name: { translate: "entity.stonecraft:stone_guard.name" } } },
        award: {
            stonePoint: 5,
            exp: 50, 
            items: [ { itemId: "stonecraft:stone_coin", amount: 10, name: { translate: "stonecraft.item.stone_coin" } } ] 
        },
        iconPath: "textures/ui/quest/entities/stone_guard",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_kill_shooter",
        title: { translate: "sc.weekly.kill_shooter.title" },
        description: { translate: "sc.weekly.kill_shooter.body" },
        condition: { killEntity: { entityType: "stonecraft:stone_shooter", amount: 15, name: { translate: "entity.stonecraft:stone_shooter.name" } } },
        award: { 
            stonePoint: 5,
            exp: 50, 
            items: [ { itemId: "stonecraft:stone_coin", amount: 8, name: { translate: "stonecraft.item.stone_coin" } } ] 
        },
        iconPath: "textures/ui/quest/entities/stone_shooter",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_kill_sandstone_guard",
        title: { translate: "sc.weekly.kill_sandstone_guard.title" },
        description: { translate: "sc.weekly.kill_sandstone_guard.body" },
        condition: { killEntity: { entityType: "stonecraft:sandstone_guard", amount: 10, name: { translate: "entity.stonecraft:sandstone_guard.name" } } },
        award: {
            stonePoint: 5,
            exp: 50, 
            items: [ { itemId: "stonecraft:stone_coin", amount: 10, name: { translate: "stonecraft.item.stone_coin" } } ] 
        },
        iconPath: "textures/ui/quest/entities/sandstone_guard",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_kill_molten_stone_guard",
        title: { translate: "sc.weekly.kill_molten_stone_guard.title" },
        description: { translate: "sc.weekly.kill_molten_stone_guard.body" },
        condition: { killEntity: { entityType: "stonecraft:molten_stone_guard", amount: 10, name: { translate: "entity.stonecraft:molten_stone_guard.name" } } },
        award: {
            stonePoint: 5,
            exp: 50, 
            items: [ { itemId: "stonecraft:stone_coin", amount: 10, name: { translate: "stonecraft.item.stone_coin" } } ] 
        },
        iconPath: "textures/ui/quest/entities/molten_stone_guard",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_use_bread",
        title: { translate: "sc.weekly.use_bread.title" },
        description: { translate: "sc.weekly.use_bread.body" },
        condition: { useItem: { itemId: "stonecraft:stone_bread", amount: 16, name: { translate: "stonecraft.item.stone_bread" } } },
        award: { stonePoint: 5, exp: 50, items: [ { itemId: "stonecraft:stone_bread", amount: 8, name: { translate: "stonecraft.item.stone_bread" } } ] },
        iconPath: "textures/items/foods/stone_bread",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_use_stonickers",
        title: { translate: "sc.weekly.use_stonickers.title" },
        description: { translate: "sc.weekly.use_stonickers.body" },
        condition: { useItem: { itemId: "stonecraft:stonickers", amount: 4, name: { translate: "stonecraft.item.stonickers" } } },
        award: { stonePoint: 5, exp: 50, items: [ { itemId: "stonecraft:stone_bread", amount: 16, name: { translate: "stonecraft.item.stonickers" } } ] },
        iconPath: "textures/items/foods/stonickers/stonickers",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_hit_with_arrow",
        title: { translate: "sc.weekly.hit_with_arrow.title" },
        description: { translate: "sc.weekly.hit_with_arrow.body" },
        condition: {
            hitEntityWithItem: {
                itemId: "stonecraft:stone_arrow",
                amount: 32,
                name: { translate: "stonecraft.item.stone_arrow" }
            }
        },
        award: {
            stonePoint: 5,
            exp: 50,
            items: [
                { itemId: "stonecraft:stone_coin", amount: 10, name: { translate: "stonecraft.item.stone_coin" } }
            ]
        },
        iconPath: "textures/items/stone_arrow",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_collect_coin",
        title: { translate: "sc.weekly.collect_coin.title" },
        description: { translate: "sc.weekly.collect_coin.body" },
        condition: { item: { itemId: "stonecraft:stone_coin", amount: 64, name: { translate: "stonecraft.item.stone_coin" } } },
        award: { stonePoint: 5, exp: 60, items: [ { itemId: "stonecraft:lv3stone", amount: 2, name: { translate: "tile.stonecraft:lv3stone.name" } } ] },
        iconPath: "textures/items/treasures/stone_coin",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_craft_lv1stone",
        title: { translate: "sc.weekly.craft_lv1stone.title" },
        description: { translate: "sc.weekly.craft_lv1stone.body" },
        condition: { item: { itemId: "stonecraft:lv1stone", amount: 32, name: { translate: "tile.stonecraft:lv1stone.name" } } },
        award: { stonePoint: 5, exp: 20, items: [ { itemId: "minecraft:iron_ingot", amount: 16, name: { translate: "item.iron_ingot.name" } } ] },
        iconPath: "textures/ui/quest/lv1_stone",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_craft_lv2stone",
        title: { translate: "sc.weekly.craft_lv2stone.title" },
        description: { translate: "sc.weekly.craft_lv2stone.body" },
        condition: { item: { itemId: "stonecraft:lv2stone", amount: 16, name: { translate: "tile.stonecraft:lv2stone.name" } } },
        award: { stonePoint: 6, exp: 25, items: [ { itemId: "minecraft:diamond", amount: 4, name: { translate: "item.diamond.name" } } ] },
        iconPath: "textures/ui/quest/lv2_stone",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_craft_lv3stone",
        title: { translate: "sc.weekly.craft_lv3stone.title" },
        description: { translate: "sc.weekly.craft_lv3stone.body" },
        condition: { item: { itemId: "stonecraft:lv3stone", amount: 4, name: { translate: "tile.stonecraft:lv3stone.name" } } },
        award: { stonePoint: 8, exp: 30, items: [ { itemId: "minecraft:netherite_ingot", amount: 1, name: { translate: "item.netherite_ingot.name" } } ] },
        iconPath: "textures/ui/quest/lv3_stone",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_dig_stone",
        title: { translate: "sc.weekly.dig_stone.title" },
        description: { translate: "sc.weekly.dig_stone.body" },
        condition: { 
            breakBlock: {
                blockType: "minecraft:stone",
                amount: 64,
                name: { translate: "tile.stone.stone.name" }
            }
        },
        award: { stonePoint: 1, exp: 10 },
        iconPath: "textures/ui/quest/cobblestone",
        autoComplete: true,
        manualReward: true
    },
];
export const WEEKLY_COMPLETION_BONUS = {
    stonePoint: 30,
    exp: 100,
    items: [
        {
            itemId: "stonecraft:lv3stone",
            amount: 16,
            name: { translate: "tile.stonecraft:lv3stone.name" }
        }
    ]
};