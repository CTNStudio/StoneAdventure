
export const SHOP_TRADES = [
    {
        id: "stone_coin_to_point",
        name: { translate: "shop.trade.coin_to_point.name" },
        description: { translate: "shop.trade.coin_to_point.desc" },
        requirements: [
            { itemId: "stonecraft:stone_coin", amount: 64, name: { translate: "stonecraft.item.stone_coin" } }
        ],
        rewards: [
            { type: "stonePoint", amount: 10, name: { translate: "sc.stone_point" } }
        ],
        iconPath: "textures/items/treasures/stone_coin"
    },
    {
        id: "stone_coin",
        name: { translate: "shop.trade.stone_coin.name" },
        description: { translate: "shop.trade.stone_coin.desc" },
        requirements: [
            { type: "stonePoint", amount: 10, name: { translate: "sc.stone_point" } }
        ],
        rewards: [
            { itemId: "stonecraft:stone_coin", amount: 64, name: { translate: "stonecraft.item.stone_coin" } }
        ],
        iconPath: "textures/items/treasures/stone_coin"
    },
    {
        id: "expansion_slab",
        name: { translate: "shop.trade.expansion_slab.name" },
        description: { translate: "shop.trade.expansion_slab.desc" },
        requirements: [
            { type: "stonePoint", amount: 64, name: { translate: "sc.stone_point" } }
        ],
        rewards: [
            { itemId: "stonecraft:expansion_slab", amount: 1, name: { translate: "stonecraft.item.expansion_slab" } }
        ],
        iconPath: "textures/items/treasures/essences/expansion_slab"
    },
    {
        id: "inlaid_essence_bead",
        name: { translate: "shop.trade.inlaid_essence_bead.name" },
        description: { translate: "shop.trade.inlaid_essence_bead.desc" },
        requirements: [
            { type: "stonePoint", amount: 32, name: { translate: "sc.stone_point" } }
        ],
        rewards: [
            { itemId: "stonecraft:inlaid_essence_bead", amount: 1, name: { translate: "stonecraft.item.inlaid_essence_bead" } }
        ],
        iconPath: "textures/items/treasures/essences/inlaid_essence_bead"
    }
];