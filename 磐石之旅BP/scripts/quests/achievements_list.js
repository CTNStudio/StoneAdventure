/**
 * 成就章节（独立维护）
 * quests.js 会把它拼进 CHAPTERS，成就系统也从这里取数据
 * 新增成就：在本文件的 quests 数组里追加任务即可，无需改动 quests.js
 */
export const ACHIEVEMENTS_CHAPTER = {
    id: "sc_achievements",
    title: { translate: "sc.achievements.title" },
    description: { 
        translate: "sc.achievements.description" },
    iconPath: "textures/ui/quest/sc_achievements",
    quests: [
        {
            id: "cobblestone_ach",
            title: { translate: "sc.quest.cobblestone_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.cobblestone_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                item: {
                    itemId: "minecraft:cobblestone",
                    amount: 1,
                    name: {
                        translate: "tile.cobblestone.name"
                    }
                }
            },
            award: {
                 exp: 20,
                 stonePoint: 1,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin",
                        amount: 2,
                        name: {
                            translate: "stonecraft.item.stone_coin"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/cobblestone"
        },
        {
            id: "andesite_ach",
            title: { translate: "sc.quest.andesite_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.andesite_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                item: {
                    itemId: "minecraft:andesite",
                    amount: 1,
                    name: {
                        translate: "tile.stone.andesite.name"
                    }
                }
            },
            award: {
                 exp: 20,
                 stonePoint: 1,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin",
                        amount: 5,
                        name: {
                            translate: "stonecraft.item.stone_coin"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/andesite_ach"
        },
        {
            id: "stone_guard_ach",
            title: { translate: "sc.quest.stone_guard_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_guard_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                killEntity: {
                    entityType: "stonecraft:stone_guard",
                    amount: 50,
                    name: { translate: "entity.stonecraft:stone_guard.name" }
                }
            },
            award: {
                 exp: 50,
                 stonePoint: 5,
                 items: [
                    {
                        itemId: "stonecraft:lv3stone",
                        amount: 3,
                        name: {
                            translate: "tile.stonecraft:lv3stone.name"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/entities/stone_guard"
        },
        {
            id: "stone_shooter_ach",
            title: { translate: "sc.quest.stone_shooter_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_shooter_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                killEntity: {
                    entityType: "stonecraft:stone_shooter",
                    amount: 50,
                    name: { translate: "entity.stonecraft:stone_shooter.name" }
                }
            },
            award: {
                 exp: 50,
                 stonePoint: 5,
                 items: [
                    {
                        itemId: "stonecraft:lv3stone",
                        amount: 4,
                        name: {
                            translate: "tile.stonecraft:lv3stone.name"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/entities/stone_shooter"
        },
        {
            id: "spire_remnant_ach",
            title: { translate: "sc.quest.spire_remnant_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.spire_remnant_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                killEntity: {
                    entityType: "stonecraft:spire_remnant",
                    amount: 10,
                    name: { translate: "entity.stonecraft:spire_remnant.name" }
                }
            },
            award: {
                 exp: 50,
                 stonePoint: 50,
                 items: [
                    {
                        itemId: "stonecraft:stone_heart",
                        amount: 1,
                        name: {
                            translate: "stonecraft.item.stone_heart"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/entities/spire_remnant"
        },
        {
            id: "hit_with_arrow_ach",
            title: { translate: "sc.ach.hit_with_arrow.title" },
            description: { translate: "sc.ach.hit_with_arrow.body" },
            condition: {
                hitEntityWithItem: {
                    itemId: "stonecraft:stone_arrow",
                    amount: 640,
                    name: { translate: "stonecraft.item.stone_arrow" }
                }
            },
            award: {
                stonePoint: 50,
                exp: 500,
                items: [
                    { 
                        itemId: "stonecraft:stone_coin", 
                        amount: 100, 
                        name: { translate: "stonecraft.item.stone_coin" } 
                    },
                    {
                        itemId: "stonecraft:stone_arrow",
                        amount: 64,
                        name: { translate: "stonecraft.item.stone_arrow" }
                    }
                ]
            },
            iconPath: "textures/items/stone_arrow",
            autoComplete: true,
            manualReward: true
        },
        {
            id: "stone_food_ach",
            title: { translate: "sc.quest.stone_food_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_food_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                 useTag: {
                    tag: "stonecraft:stone_food",
                    amount: 1,
                    name: {
                        translate: "stonecraft.tag.stone_food"
                    }
                }
            },
            award: {
                 exp: 20,
                 stonePoint: 1,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin",
                        amount: 5,
                        name: {
                            translate: "stonecraft.item.stone_coin"
                        }
                    }
                ]
            },
            iconPath: "textures/items/foods/stone_bread"
        },
        {
            id: "stone_baguette_ach",
            title: { translate: "sc.quest.stone_baguette_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_baguette_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                useItem: {
                    itemId: "stonecraft:stone_bread",
                    amount: 100,
                    name: {
                        translate: "stonecraft.item.stone_bread"
                    }
                }
            },
            award: {
                 exp: 100,
                 stonePoint: 10,
                 items: [
                    {
                        itemId: "stonecraft:stone_bread",
                        amount: 64,
                        name: {
                            translate: "stonecraft.item.stone_bread"
                        }
                    }
                ]
            },
            iconPath: "textures/items/foods/stone_bread"
        },
        {
            id: "stone_food_collector_ach",
            title: { translate: "sc.quest.stone_food_collector_ach.title" },
            description: { translate: "sc.quest.stone_food_collector_ach.body" },
            autoComplete: true,
            manualReward: true,
            condition: {
                useEachItem: {
                    items: [
                        { itemId: "stonecraft:stone_bread", amount: 1, name: { translate: "stonecraft.item.stone_bread" } },
                        { itemId: "stonecraft:stone_cookie", amount: 1, name: { translate: "stonecraft.item.stone_cookie" } },
                        { itemId: "stonecraft:stone_hodgepodge", amount: 1, name: { translate: "stonecraft.item.stone_hodgepodge" } },
                        { itemId: "stonecraft:stone_apple", amount: 1, name: { translate: "stonecraft.item.stone_apple" } },
                        { itemId: "stonecraft:stone_carrot", amount: 1, name: { translate: "stonecraft.item.stone_carrot" } },
                        { itemId: "stonecraft:stone_kelp", amount: 1, name: { translate: "stonecraft.item.stone_kelp" } },
                        { itemId: "stonecraft:stone_melon", amount: 1, name: { translate: "stonecraft.item.stone_melon" } },
                        { itemId: "stonecraft:stone_potato", amount: 1, name: { translate: "stonecraft.item.stone_potato" } },
                        { itemId: "stonecraft:stone_cooked_cod", amount: 1, name: { translate: "stonecraft.item.stone_cooked_cod" } },
                        { itemId: "stonecraft:stone_glow_berries", amount: 1, name: { translate: "stonecraft.item.stone_glow_berries" } },
                        { itemId: "stonecraft:stone_sweet_berries", amount: 1, name: { translate: "stonecraft.item.stone_sweet_berries" } },
                        { itemId: "stonecraft:stone_cooked_beef", amount: 1, name: { translate: "stonecraft.item.stone_cooked_beef" } },
                        { itemId: "stonecraft:stonickers", amount: 1, name: { translate: "stonecraft.item.stonickers" } },
                        { itemId: "stonecraft:compressed_stonickers_lv1", amount: 1, name: { translate: "stonecraft.item.compressed_stonickers_lv1" } },
                        { itemId: "stonecraft:compressed_stonickers_lv2", amount: 1, name: { translate: "stonecraft.item.compressed_stonickers_lv2" } },
                        { itemId: "stonecraft:compressed_stonickers_lv3", amount: 1, name: { translate: "stonecraft.item.compressed_stonickers_lv3" } },
                        { itemId: "stonecraft:compressed_stonickers_lv4", amount: 1, name: { translate: "stonecraft.item.compressed_stonickers_lv4" } },
                        { itemId: "stonecraft:compressed_stonickers_lv5", amount: 1, name: { translate: "stonecraft.item.compressed_stonickers_lv5" } },
                    ],
                    displayName: { translate: "stonecraft.item.stone_coin" }
                }
            },
            award: {
                exp: 200,
                stonePoint: 200,
                items: [
                    {
                        itemId: "stonecraft:stone_bread",
                        amount: 128,
                        name: {
                            translate: "stonecraft.item.stone_bread"
                        }
                    }
                ]
            },
            iconPath: "textures/items/foods/stone_bread"
        },
        {
            id: "stone_totem_ach",
            title: { translate: "sc.quest.stone_totem_ach.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_totem_ach.body"  },
                    { text: "\n" }
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                killEntity: {
                    entityType: "stonecraft:ancient_stone_totem",
                    amount: 1,
                    name: { translate: "entity.stonecraft:ancient_stone_totem.name" }
                }
            },
            award: {
                 exp: 200,
                 stonePoint: 100,
                 items: [
                    {
                        itemId: "stonecraft:inlaid_essence_bead_combo",
                        amount: 1,
                        name: {
                            translate: "stonecraft.item.stone_essence_crystal.combo"
                        }
                    }
                ]
            },
            iconPath: "textures/ui/quest/entities/ancient_stone_totem"
        },
        {
            id: "lv5stone_armors_ach",
            title: { translate: "sc.quest.lv5stone_armors.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.lv5stone_armors.body" },
                    { text: "\n" },
                ]
            },
            autoComplete: true,
            manualReward: true,
            condition: {
                allItems: [
                    {
                        itemId: "stonecraft:lv5stone_helmet",
                        amount: 1,
                        name: { translate: "stonecraft.item.helmet.lv5" }
                    },
                    {
                        itemId: "stonecraft:lv5stone_chestplate",
                        amount: 1,
                        name: { translate: "stonecraft.item.chestplate.lv5" }
                    },
                    {
                        itemId: "stonecraft:lv5stone_leggings",
                        amount: 1,
                        name: { translate: "stonecraft.item.leggings.lv5" }
                    },
                    {
                        itemId: "stonecraft:lv5stone_boots",
                        amount: 1,
                        name: { translate: "stonecraft.item.boots.lv5" }
                    }
                ]
            },
            award: {
                exp: 1000,
                stonePoint: 500,
                items: [
                    {
                        itemId: "stonecraft:stone_star",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_star" }
                    },
                    {
                        itemId: "minecraft:iron_ingot",
                        amount: 64,
                        name: { translate: "item.iron_ingot.name" }
                    },
                    {
                        itemId: "stonecraft:stone_coin",
                        amount: 128,
                        name: { translate: "stonecraft.item.stone_coin" }
                    },
                    {
                        itemId: "minecraft:diamond",
                        amount: 32,
                        name: { translate: "item.diamond.name" }
                    },
                    {
                        itemId: "minecraft:netherite_ingot",
                        amount: 4,
                        name: { translate: "item.netherite_ingot.name" }
                    }
                ]
            },
            iconPath: "textures/items/armors/chestplates/lv5"
        },
    ]
    };
