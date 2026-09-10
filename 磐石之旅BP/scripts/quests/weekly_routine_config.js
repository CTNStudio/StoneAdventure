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
        id: "weekly_use_bread",
        title: { translate: "sc.weekly.use_bread.title" },
        description: { translate: "sc.weekly.use_bread.body" },
        condition: { useItem: { itemId: "stonecraft:stone_bread", amount: 30, name: { translate: "stonecraft.item.stone_bread" } } },
        award: { stonePoint: 5, exp: 50, items: [ { itemId: "stonecraft:stone_bread", amount: 16, name: { translate: "stonecraft.item.stone_bread" } } ] },
        iconPath: "textures/items/foods/stone_bread",
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
        id: "weekly_kill_totem",
        title: { translate: "sc.weekly.kill_totem.title" },
        description: { translate: "sc.weekly.kill_totem.body" },
        condition: { killEntity: { entityType: "stonecraft:ancient_stone_totem", amount: 1, name: { translate: "entity.stonecraft:ancient_stone_totem.name" } } },
        award: { stonePoint: 100, exp: 100, items: [ { itemId: "stonecraft:stone_star", amount: 1, name: { translate: "stonecraft.item.stone_star" } } ] },
        iconPath: "textures/ui/quest/entities/ancient_stone_totem",
        autoComplete: true,
        manualReward: true
    },
    {
        id: "weekly_dig_stone",
        title: { translate: "sc.weekly.dig_stone.title" },
        description: { translate: "sc.weekly.dig_stone.body" },
        condition: { item: { itemId: "minecraft:cobblestone", amount: 64, name: { translate: "tile.stonecraft:lv3stone.name" } } },
        award: { stonePoint: 1, exp: 10 },
        iconPath: "textures/ui/quest/cobblestone",
        autoComplete: true,
        manualReward: true
    },
];