
export const SHOP_TRADES = [
    {
        id: "stone_coin_to_point",
        name: { translate: "shop.trade.coin_to_point.name" },
        description: { translate: "shop.trade.coin_to_point.desc" },
        requirements: [
            { itemId: "stonecraft:stone_coin", amount: 64 }
        ],
        rewards: [
            { type: "stonePoint", amount: 10 }
        ],
        iconPath: "textures/items/treasures/stone_coin"
    }
];