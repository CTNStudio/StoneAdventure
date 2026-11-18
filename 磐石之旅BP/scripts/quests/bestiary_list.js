/**
 * 生物志章节（独立维护）
 * quests.js 会把它拼进 CHAPTERS，生物志界面通过 CHAPTERS 取数据
 * 新增条目：在本文件的 quests 数组里追加任务即可，无需改动 quests.js
 */
export const BOSS_ENTITIES = [
    "stonecraft:ancient_stone_totem",
    "stonecraft:spire_remnant",
    "stonecraft:pale_martyr"
];
export const BESTIARY_CHAPTER = {
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
            id: "sculk_statue",
            title: { translate: "sc.quest.sculk_statue.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.sculk_statue.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.sculk_statue.body1" },
                    { text: "\n" }
                ]
            },
            condition: {
                killEntity: {
                    entityType: "stonecraft:sculk_statue",
                    amount: 1,
                    name: { translate: "entity.stonecraft:sculk_statue.name" }
                }
            },
            award: {
                 exp: 50,
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
            iconPath: "textures/ui/quest/entities/sculk_statue"
        },
        {
            id: "stone_puppet",
            title: { translate: "sc.quest.stone_puppet.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.stone_puppet.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.stone_puppet.body1" },
                    { text: "\n" }
                ]
            },
            condition: {
                killEntity: {
                    entityType: "stonecraft:stone_puppet",
                    amount: 1,
                    name: { translate: "entity.stonecraft:stone_puppet.name" }
                }
            },
            award: {
                 exp: 20,
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
            iconPath: "textures/ui/quest/entities/stone_puppet"
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
            id: "wandering_collector",
            title: { translate: "sc.quest.wandering_collector.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.wandering_collector.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.wandering_collector.body1" },
                    { text: "\n" }
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
                 exp: 10,
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
            iconPath: "textures/ui/quest/entities/wandering_collector"
        },
        {
            id: "snatcher",
            title: { translate: "sc.quest.snatcher.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.snatcher.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.snatcher.body1" },
                    { text: "\n" }
                ]
            },
            condition: {
                killEntity: {
                    entityType: "stonecraft:snatcher",
                    amount: 1,
                    name: { translate: "entity.stonecraft:snatcher.name" }
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
            iconPath: "textures/ui/quest/entities/snatcher"
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
                 exp: 100,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin", 
                        amount: 64, 
                        name: { 
                            translate: "stonecraft.item.stone_coin" 
                        }
                    },
                    {
                        itemId: "stonecraft:stone_star", 
                        amount: 1, 
                        name: { 
                            translate: "stonecraft.item.stone_star" 
                        }
                    },
                    {
                        itemId: "minecraft:netherite_ingot", 
                        amount: 3, 
                        name: { 
                            translate: "item.netherite_ingot.name" 
                        }
                    },
                ]
            },
            iconPath: "textures/ui/quest/entities/ancient_stone_totem"
        },
        {
            id: "spire_remnant",
            title: { translate: "sc.quest.spire_remnant.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.spire_remnant.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.spire_remnant.body1" },
                    { text: "\n" },
                    { translate: "sc.quest.spire_remnant.body2" },
                    { text: "\n" }
                ]
            },
            condition: {
                killEntity: {
                    entityType: "stonecraft:spire_remnant",
                    amount: 1,
                    name: { translate: "entity.stonecraft:spire_remnant.name" }
                }
            },
            award: {
                 exp: 40,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin", 
                        amount: 32, 
                        name: { 
                            translate: "stonecraft.item.stone_coin" 
                        }
                    },
                    {
                        itemId: "minecraft:iron_ingot",
                        amount: 16,
                        name: { translate: "item.iron_ingot.name" }
                    },
                    {
                        itemId: "minecraft:diamond",
                        amount: 8,
                        name: { translate: "item.diamond.name" }
                    },
                ]
            },
            iconPath: "textures/ui/quest/entities/spire_remnant"
        },
        {
            id: "pale_martyr",
            title: { translate: "sc.quest.pale_martyr.title" },
            description: {
                rawtext: [
                    { translate: "sc.quest.pale_martyr.body"  },
                    { text: "\n\n" },
                    { translate: "sc.quest.pale_martyr.body1" },
                    { text: "\n" },
                    { translate: "sc.quest.pale_martyr.body2" },
                    { text: "\n" }
                ]
            },
            condition: {
                killEntity: {
                    entityType: "stonecraft:pale_martyr",
                    amount: 1,
                    name: { translate: "entity.stonecraft:pale_martyr.name" }
                }
            },
            award: {
                 exp: 150,
                 stonePoint: 50,
                 items: [
                    {
                        itemId: "stonecraft:stone_coin", 
                        amount: 32, 
                        name: { 
                            translate: "stonecraft.item.stone_coin" 
                        }
                    },
                    {
                        itemId: "minecraft:iron_ingot",
                        amount: 16,
                        name: { translate: "item.iron_ingot.name" }
                    },
                    {
                        itemId: "minecraft:diamond",
                        amount: 8,
                        name: { translate: "item.diamond.name" }
                    },
                ]
            },
            iconPath: "textures/ui/quest/entities/pale_martyr"
        }
    ]
};
