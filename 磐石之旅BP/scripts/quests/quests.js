//import { world, system, ItemStack, Player, EquipmentSlot } from "@minecraft/server";
//import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

/**
 * @typedef {Object} Award
 * @property {number} [exp] - 奖励经验点数
 * @property {number} [level] - 奖励等级数
 * @property {Array<{itemId: string, amount: number, name: RawMessage | string}>} [items] - 奖励的物品列表
 */

/**
 * @typedef {Object} Quest
 * @property {string} id
 * @property {RawMessage|string} title
 * @property {RawMessage|string} description
 * @property {Object} condition
 * @property {Award} award
 * @property {string} [iconPath]
 */

/**
 * @typedef {Object} Chapter
 * @property {string} id
 * @property {RawMessage|string} title
 * @property {RawMessage|string} [description]
 * @property {string} [iconPath]
 * @property {Quest[]} quests
 */

/** @type {Chapter[]} */
export const CHAPTERS = [
    {
        id: "sc_chapter_1",
        title: { translate: "sc.chapter_1.title" },
        description: { translate: "sc.chapter_1.description" },
        iconPath: "textures/ui/quest/cobblestone",
        quests: [
            {
                id: "cobble_stone",
                title: { translate: "sc.quest.cobblestone.title" },
                description: { translate: "sc.quest.cobblestone.body" },
                condition: {
                    item: {
                        itemId: "minecraft:cobblestone",
                        amount: 1,
                        name: { translate: "tile.cobblestone.name" }
                    }
                },
                award: { exp: 10 },
                iconPath: "textures/ui/quest/cobblestone"
            },
            {
                id: "stone_convert_table",
                title: { translate: "sc.quest.stone_convert_table.title" },
                description: { translate: "sc.quest.stone_convert_table.body" },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_convert_table",
                        amount: 1,
                        name: { translate: "tile.stonecraft:stone_convert_table.name" }
                    }
                },
                award: { exp: 15 },
                iconPath: "textures/ui/quest/stone_convert_table"
            },
            {
                id: "stone_armor",
                title: { translate: "sc.quest.stone_armor.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_armor.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_armor.body1" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_armor.body2" }
                    ]
                },
                condition: {
                    anyItem: [
                        {
                            itemId: "stonecraft:lv0stone_helmet",
                            amount: 1,
                            name: { translate: "stonecraft.item.helmet.lv0" }
                        },
                        {
                            itemId: "stonecraft:lv0stone_chestplate",
                            amount: 1,
                            name: { translate: "stonecraft.item.chestplate.lv0" }
                        },
                        {
                            itemId: "stonecraft:lv0stone_leggings",
                            amount: 1,
                            name: { translate: "stonecraft.item.leggings.lv0" }
                        },
                        {
                            itemId: "stonecraft:lv0stone_boots",
                            amount: 1,
                            name: { translate: "stonecraft.item.boots.lv0" }
                        }
                    ]
                },
                award: { exp: 20 },
                iconPath: "textures/items/armors/chestplates/lv0"
            },
            {
                id: "stone_hammer",
                title: { translate: "sc.quest.stone_hammer.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_hammer.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_hammer.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_hammer",
                        amount: 1,
                        name: { translate: "stonecraft.item.hammer.lv0" }
                    }
                },
                award: { exp: 20 },
                iconPath: "textures/items/tools/hammers/stone_hammer"
            },
            {
                id: "stone_nugget",
                title: { translate: "sc.quest.stone_nugget.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_nugget.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_nugget.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_nugget",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_nugget" }
                    }
                },
                award: { exp: 10 },
                iconPath: "textures/items/materials/stone_nugget"
            },
            {
                id: "stone_coin",
                title: { translate: "sc.quest.stone_coin.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_coin.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_coin.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_coin",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_coin" }
                    }
                },
                award: { exp: 10 },
                iconPath: "textures/items/treasures/stone_coin"
            },
            {
                id: "stone_food",
                title: { translate: "sc.quest.stone_food.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_food.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_food.body1" }
                    ]
                },
                condition: {
                    anyTag: [
                        { tag: "stonecraft:stone_food", name: { translate: "stonecraft.tag.stone_food" } }
                    ]
                },
                award: { exp: 15 },
                iconPath: "textures/items/foods/stone_bread"
            }
        ]
    },
    {
        id: "sc_chapter_2",
        title: { translate: "sc.chapter_2.title" },
        description: { translate: "sc.chapter_2.description" },
        iconPath: "textures/ui/quest/lv3_stone",
        quests: [
            {
                id: "lv1_stone",
                title: { translate: "sc.quest.lv1_stone.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv1_stone.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv1_stone.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv1stone",
                        amount: 1,
                        name: { translate: "tile.stonecraft:lv1stone.name" }
                    }
                },
                award: {
                    exp: 20,
                    items: [
                        {
                            itemId: "minecraft:cobblestone",
                            amount: 1,
                            name: { translate: "tile.cobblestone.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/lv1_stone"
            },
            {
                id: "stone_pickaxe_lv1",
                title: { translate: "sc.quest.lv1stone_pickaxe.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv1stone_pickaxe.body" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv1stone_pickaxe",
                        amount: 1,
                        name: { translate: "stonecraft.item.pickaxe.lv1" }
                    }
                },
                award: {
                    exp: 10,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 4,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/tools/pickaxes/lv1"
            },
            {
                id: "lv2_stone",
                title: { translate: "sc.quest.lv2_stone.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv2_stone.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv2_stone.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv2stone",
                        amount: 1,
                        name: { translate: "tile.stonecraft:lv2stone.name" }
                    }
                },
                award: {
                    exp: 30,
                    items: [
                        {
                            itemId: "stonecraft:lv1stone",
                            amount: 1,
                            name: { translate: "tile.stonecraft:lv1stone.name" }
                        },
                        {
                            itemId: "minecraft:iron_ingot",
                            amount: 1,
                            name: { translate: "item.iron_ingot.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/lv2_stone"
            },
            {
                id: "stone_pickaxe_lv2",
                title: { translate: "sc.quest.lv2stone_pickaxe.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv2stone_pickaxe.body" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv2stone_pickaxe",
                        amount: 1,
                        name: { translate: "stonecraft.item.pickaxe.lv2" }
                    }
                },
                award: { 
                    exp: 15,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 8,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/tools/pickaxes/lv2"
            },
            {
                id: "lv3_stone",
                title: { translate: "sc.quest.lv3_stone.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv3_stone.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv3_stone.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv3stone",
                        amount: 1,
                        name: { translate: "tile.stonecraft:lv3stone.name" }
                    }
                },
                award: {
                    exp: 50,
                    items: [
                        {
                            itemId: "stonecraft:lv2stone",
                            amount: 1,
                            name: { translate: "tile.stonecraft:lv2stone.name" }
                        },
                        {
                            itemId: "minecraft:diamond",
                            amount: 1,
                            name: { translate: "item.diamond.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/lv3_stone"
            },
            {
                id: "stone_pickaxe_lv3",
                title: { translate: "sc.quest.lv3stone_pickaxe.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv3stone_pickaxe.body" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv3stone_pickaxe",
                        amount: 1,
                        name: { translate: "stonecraft.item.pickaxe.lv3" }
                    }
                },
                award: { 
                    exp: 25,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 16,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/tools/pickaxes/lv3"
            }
        ]
    },
    {
        id: "sc_chapter_3",
        title: { translate: "sc.chapter_3.title" },
        description: { translate: "sc.chapter_3.description" },
        iconPath: "textures/items/treasures/stone_star",
        quests: [
            {
                id: "head_debris",
                title: { translate: "sc.quest.head_debris.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.head_debris.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.head_debris.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:head_debris",
                        amount: 1,
                        name: { translate: "stonecraft.item.head_debris" }
                    }
                },
                award: { 
                    exp: 10,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 8,
                            name: { translate: "stonecraft.item.stone_coin" }
                        },
                        {
                            itemId: "minecraft:bone",
                            amount: 5,
                            name: { translate: "item.bone.name" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/head_debris"
            },
            {
                id: "head_shard",
                title: { translate: "sc.quest.head_shard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.head_shard.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.head_shard.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:head_shard",
                        amount: 1,
                        name: { translate: "stonecraft.item.head_shard" }
                    }
                },
                award: { 
                    exp: 20,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 16,
                            name: { translate: "stonecraft.item.stone_coin" }
                        },
                        {
                            itemId: "minecraft:soul_sand",
                            amount: 4,
                            name: { translate: "tile.minecraft:soul_sand.name" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/head_shard"
            },
            {
                id: "stone_star",
                title: { translate: "sc.quest.stone_star.title" },
                description: { translate: "sc.quest.stone_star.body" },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_star",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_star" }
                    }
                },
                award: {
                    exp: 200,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 64,
                            name: { translate: "stonecraft.item.stone_coin" }
                        },
                        {
                            itemId: "minecraft:diamond",
                            amount: 24,
                            name: { translate: "item.diamond.name" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/stone_star"
            },
            {
                id: "stone_crafting_table",
                title: { translate: "sc.quest.stone_crafting_table.title" },
                description: { translate: "sc.quest.stone_crafting_table.body" },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_crafting_table",
                        amount: 1,
                        name: { translate: "tile.stonecraft:stone_crafting_table.name" }
                    }
                },
                award: {
                    exp: 100,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 16,
                            name: { translate: "stonecraft.item.stone_coin" }
                        },
                        {
                            itemId: "minecraft:diamond",
                            amount: 8,
                            name: { translate: "item.diamond.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/stone_crafting_table"
            },
            {
                id: "lv4_stone",
                title: { translate: "sc.quest.lv4_stone.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv4_stone.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv4_stone.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv4stone",
                        amount: 1,
                        name: { translate: "tile.stonecraft:lv4stone.name" }
                    }
                },
                award: {
                    exp: 80,
                    items: [
                        {
                            itemId: "stonecraft:lv3stone",
                            amount: 1,
                            name: { translate: "tile.stonecraft:lv3stone.name" }
                        },
                        {
                            itemId: "minecraft:ancient_debris",
                            amount: 1,
                            name: { translate: "tile.ancient_debris.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/lv4_stone"
            },
            {
                id: "lv5_stone",
                title: { translate: "sc.quest.lv5_stone.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv5_stone.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv5_stone.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv5stone",
                        amount: 1,
                        name: { translate: "tile.stonecraft:lv5stone.name" }
                    }
                },
                award: {
                    exp: 120,
                    items: [
                        {
                            itemId: "stonecraft:lv4stone",
                            amount: 1,
                            name: { translate: "tile.stonecraft:lv4stone.name" }
                        },
                        {
                            itemId: "minecraft:netherite_ingot",
                            amount: 1,
                            name: { translate: "item.netherite_ingot.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/lv5_stone"
            },
            {
                id: "stone_sword_lv5",
                title: { translate: "sc.quest.lv5stone_sword.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv5stone_sword.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv5stone_sword.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:lv5stone_sword",
                        amount: 1,
                        name: { translate: "stonecraft.item.sword.lv5" }
                    }
                },
                award: { 
                    exp: 30,
                    items: [
                        {
                            itemId: "stonecraft:lv5stone",
                            amount: 1,
                            name: { translate: "tile.stonecraft:lv5stone.name" }
                        },
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/tools/swords/lv5"
            },
            {
                id: "lv5stone_armors",
                title: { translate: "sc.quest.lv5stone_armors.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.lv5stone_armors.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.lv5stone_armors.body1" }
                    ]
                },
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
            {
                id: "stone_hodgepodge",
                title: { translate: "sc.quest.stone_hodgepodge.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_hodgepodge.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_hodgepodge.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_hodgepodge",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_hodgepodge" }
                    }
                },
                award: {
                    exp: 150,
                    items: [
                        {
                            itemId: "minecraft:diamond",
                            amount: 4,
                            name: { translate: "item.diamond.name" }
                        },
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/foods/stone_hodgepodge"
            }
        ]
    },
    {
        id: "sc_chapter_4",
        title: { translate: "sc.chapter_4.title" },
        description: { translate: "sc.chapter_4.description" },
        iconPath: "textures/items/treasures/essences/inlaid_essence_bead",
        quests: [
            {
                id: "stone_essence",
                title: { translate: "sc.quest.stone_essence.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_essence.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_essence.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_essence",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_essence" }
                    }
                },
                award: { 
                    exp: 50,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/essences/stone_essence"
            },
            {
                id: "stone_essence_crystal",
                title: { translate: "sc.quest.stone_essence_crystal.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_essence_crystal.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_essence_crystal.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_essence_crystal",
                        amount: 1,
                        name: { translate: "stonecraft.item.stone_essence_crystal" }
                    }
                },
                award: { 
                    exp: 100,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/essences/stone_essence_crystal"
            },
            {
                id: "stone_smithing_table",
                title: { translate: "sc.quest.stone_smithing_table.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_smithing_table.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_smithing_table.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_smithing_table",
                        amount: 1,
                        name: { translate: "tile.stonecraft:stone_smithing_table.name" }
                    }
                },
                award: {
                    exp: 200,
                    items: [
                        {
                            itemId: "minecraft:netherite_ingot",
                            amount: 4,
                            name: { translate: "item.netherite_ingot.name" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/stone_smithing_table"
            },
            {
                id: "inlaid_essence_bead",
                title: { translate: "sc.quest.inlaid_essence_bead.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.inlaid_essence_bead.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.inlaid_essence_bead.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:inlaid_essence_bead",
                        amount: 1,
                        name: { translate: "stonecraft.item.inlaid_essence_bead" }
                    }
                },
                award: { 
                    exp: 150,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/essences/inlaid_essence_bead"
            },
            {
                id: "expansion_slab",
                title: { translate: "sc.quest.expansion_slab.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.expansion_slab.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.expansion_slab.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:expansion_slab",
                        amount: 1,
                        name: { translate: "stonecraft.item.expansion_slab" }
                    }
                },
                award: { 
                    exp: 150,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/treasures/essences/expansion_slab"
            }
        ]
    },
    {
        id: "sc_chapter_5",
        title: { translate: "sc.chapter_5.title" },
        description: { translate: "sc.chapter_5.description" },
        iconPath: "textures/items/sacrifice/blood_bottle",
        quests: [
            {
                id: "sacrificial_blade",
                title: { translate: "sc.quest.sacrificial_blade.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.sacrificial_blade.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.sacrificial_blade.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:sacrificial_blade",
                        amount: 1,
                        name: { translate: "stonecraft.item.sacrificial_blade" }
                    }
                },
                award: { 
                    exp: 25,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 16,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/sacrifice/sacrificial_blade"
            },
            {
                id: "blood_bottle",
                title: { translate: "sc.quest.blood_bottle.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.blood_bottle.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.blood_bottle.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:blood_bottle",
                        amount: 1,
                        name: { translate: "stonecraft.item.blood_bottle" }
                    }
                },
                award: { 
                    exp: 10,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 4,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/sacrifice/blood_bottle"
            },
            {
                id: "ersatz_blood_vial",
                title: { translate: "sc.quest.ersatz_blood_vial.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.ersatz_blood_vial.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.ersatz_blood_vial.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:ersatz_blood_vial",
                        amount: 1,
                        name: { translate: "stonecraft.item.ersatz_blood_vial" }
                    }
                },
                award: {
                    exp: 50,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/sacrifice/ersatz_blood_vial"
            },
            {
                id: "blood_offering_vial",
                title: { translate: "sc.quest.blood_offering_vial.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.blood_offering_vial.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.blood_offering_vial.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:blood_offering_vial",
                        amount: 1,
                        name: { translate: "stonecraft.item.blood_offering_vial" }
                    }
                },
                award: { 
                    exp: 150,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/items/sacrifice/blood_offering_vial"
            },
            {
                id: "stone_summoner_activated",
                title: { translate: "sc.quest.stone_summoner_activated.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_summoner_activated.body" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_summoner_activated.body1" }
                    ]
                },
                condition: {
                    item: {
                        itemId: "stonecraft:stone_summoner_activated",
                        amount: 1,
                        name: { translate: "tile.stonecraft:stone_summoner_activated.name" }
                    }
                },
                award: { 
                    exp: 50,
                    items: [
                        {
                            itemId: "stonecraft:stone_coin",
                            amount: 32,
                            name: { translate: "stonecraft.item.stone_coin" }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/stone_summoner_activated"
            }
        ]
    },
    {
        id: "sc_biogeography",
        title: { translate: "sc.biogeography.title" },
        description: { 
            translate: "sc.biogeography.description" },
        iconPath: "textures/ui/quest/sc_biogeography",
        quests: [
            {
                id: "stone_guard",
                title: { translate: "sc.quest.stoneguard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stoneguard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stoneguard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_guard.name" }
                    }
                },
                award: {
                     exp: 20,
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
                iconPath: "textures/ui/quest/entities/stone_guard"
            },
            {
                id: "stone_shooter",
                title: { translate: "sc.quest.stone_shooter.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_shooter.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_shooter.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_shooter",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_shooter.name" }
                    }
                },
                award: {
                     exp: 20,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 6, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/stone_shooter"
            },
            {
                id: "elder_stone_guard",
                title: { translate: "sc.quest.elder_stone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.elder_stone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.elder_stone_guard.body1"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.elder_stone_guard.body2" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:elder_stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:elder_stone_guard.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 10, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/elder_stone_guard"
            },
            {
                id: "stone_vendor",
                title: { translate: "sc.quest.stone_vendor.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_vendor.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_vendor.body1" },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_vendor.body2" },
                        { text: "\n\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_vendor",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_vendor.name" }
                    }
                },
                award: {
                     exp: 5,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 16, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/stone_vendor"
            },
            {
                id: "wandering_collector",
                title: { translate: "sc.quest.wandering_collector.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.wandering_collector.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.wandering_collector.body1" },
                        { text: "\n\n" },
                        { translate: "sc.quest.wandering_collector.body2" },
                        { text: "\n\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:wandering_collector",
                        amount: 1,
                        name: { translate: "entity.stonecraft:wandering_collector.name" }
                    }
                },
                award: {
                     exp: 5,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 4, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/wandering_collector"
            },
            {
                id: "stone_vagabond",
                title: { translate: "sc.quest.stone_vagabond.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_vagabond.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_vagabond.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_vagabond",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_vagabond.name" }
                    }
                },
                award: {
                     exp: 30,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 8, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/stone_vagabond"
            },
            {
                id: "stone_fissuring_husk",
                title: { translate: "sc.quest.stone_fissuring_husk.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_fissuring_husk.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_fissuring_husk.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_fissuring_husk",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_fissuring_husk.name" }
                    }
                },
                award: {
                     exp: 30,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 8, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/stone_fissuring_husk"
            },
            {
                id: "stone_block",
                title: { translate: "sc.quest.stone_block.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stone_block.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stone_block.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_block",
                        amount: 1,
                        name: { translate: "entity.stonecraft:stone_block.name" }
                    }
                },
                award: {
                     exp: 10,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 1, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/stone_block"
            },
            {
                id: "deepslate_stone_guard",
                title: { translate: "sc.quest.deepslate_stone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.deepslate_stone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.deepslate_stone_guard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:deepslate_stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:deepslate_stone_guard.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 10, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/deepslate_stone_guard"
            },
            {
                id: "deepslate_stone_shooter",
                title: { translate: "sc.quest.deepslate_stone_shooter.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.deepslate_stone_shooter.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.deepslate_stone_shooter.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:deepslate_stone_shooter",
                        amount: 1,
                        name: { translate: "entity.stonecraft:deepslate_stone_shooter.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 12, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/deepslate_stone_shooter"
            },
            {
                id: "molten_stone_guard",
                title: { translate: "sc.quest.molten_stone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.molten_stone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.molten_stone_guard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:molten_stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:molten_stone_guard.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 10, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/molten_stone_guard"
            },
            {
                id: "molten_stone_shooter",
                title: { translate: "sc.quest.molten_stone_shooter.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.molten_stone_shooter.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.molten_stone_shooter.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:molten_stone_shooter",
                        amount: 1,
                        name: { translate: "entity.stonecraft:molten_stone_shooter.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 12, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/molten_stone_shooter"
            },
            {
                id: "molten_elder_stone_guard",
                title: { translate: "sc.quest.molten_elder_stone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.molten_elder_stone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.molten_elder_stone_guard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:molten_elder_stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:molten_elder_stone_guard.name" }
                    }
                },
                award: {
                     exp: 500,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 64, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/molten_elder_stone_guard"
            },
            {
                id: "mossy_stone_guard",
                title: { translate: "sc.quest.mossy_stone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.mossy_stone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.mossy_stone_guard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:mossy_stone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:mossy_stone_guard.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 10, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/mossy_stone_guard"
            },
            {
                id: "mossy_stone_shooter",
                title: { translate: "sc.quest.mossy_stone_shooter.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.mossy_stone_shooter.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.mossy_stone_shooter.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:mossy_stone_shooter",
                        amount: 1,
                        name: { translate: "entity.stonecraft:mossy_stone_shooter.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 12, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/mossy_stone_shooter"
            },
            {
                id: "sandstone_guard",
                title: { translate: "sc.quest.sandstone_guard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.sandstone_guard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.sandstone_guard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:sandstone_guard",
                        amount: 1,
                        name: { translate: "entity.stonecraft:sandstone_guard.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 10, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/sandstone_guard"
            },
            {
                id: "sandstone_shooter",
                title: { translate: "sc.quest.sandstone_shooter.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.sandstone_shooter.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.sandstone_shooter.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:sandstone_shooter",
                        amount: 1,
                        name: { translate: "entity.stonecraft:sandstone_shooter.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 12, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/sandstone_shooter"
            },
            {
                id: "ancient_stone_totem",
                title: { translate: "sc.quest.ancient_stone_totem.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.ancient_stone_totem.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.ancient_stone_totem.body1" },
                        { text: "\n" },
                        { translate: "sc.quest.ancient_stone_totem.body2" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:ancient_stone_totem",
                        amount: 1,
                        name: { translate: "entity.stonecraft:ancient_stone_totem.name" }
                    }
                },
                award: {
                     exp: 40,
                     items: [
                        {
                            itemId: "stonecraft:stone_coin", 
                            amount: 12, 
                            name: { 
                                translate: "stonecraft.item.stone_coin" 
                            }
                        }
                    ]
                },
                iconPath: "textures/ui/quest/entities/ancient_stone_totem"
            }
        ]
    },
    {
        id: "sc_achievements",
        title: { translate: "sc.achievements.title" },
        description: { 
            translate: "sc.achievements.description" },
        iconPath: "textures/ui/quest/sc_achievements",
        quests: [
            {
                id: "stone_guard_ach",
                title: { translate: "sc.quest.stoneguard.title" },
                description: {
                    rawtext: [
                        { translate: "sc.quest.stoneguard.body"  },
                        { text: "\n\n" },
                        { translate: "sc.quest.stoneguard.body1" },
                        { text: "\n" }
                    ]
                },
                condition: {
                    killEntity: {
                        entityType: "stonecraft:stone_guard",
                        amount: 10,
                        name: { translate: "entity.stonecraft:stone_guard.name" }
                    }
                },
                award: {
                     exp: 20,
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
                iconPath: "textures/ui/quest/entities/stone_guard"
            }
        ]
    }
];