
export const STONE_TIDE_CONFIG = {
    // 石潮爆发概率（0~1）
    triggerChance: 0.2,
    // 每个玩家每次生成生物数量
    spawnCountPerPlayer: 2,
    // 生成半径（格）
    minSpawnRadius: 16,
    spawnRadius: 32,
    // 可生成的生物类型列表
    mobTypes: [
        "stonecraft:stone_guard",
        "stonecraft:stone_shooter",
        "stonecraft:stone_fissuring_husk"
        // 可继续添加
    ],
    avoidBlockTypes: [
        "minecraft:water",
        "minecraft:lava",
        "minecraft:bedrock",
        "minecraft:farmland",
        "minecraft:oak_fence", "minecraft:spruce_fence", "minecraft:birch_fence",
        "minecraft:jungle_fence", "minecraft:acacia_fence", "minecraft:dark_oak_fence",
        "minecraft:mangrove_fence", "minecraft:cherry_fence", "minecraft:pale_oak_fence",
        "minecraft:bamboo_fence", "minecraft:crimson_fence", "minecraft:warped_fence",
        "minecraft:nether_brick_fence",
        // 作物类
        "minecraft:wheat", "minecraft:carrots", "minecraft:potatoes",
        "minecraft:beetroots", "minecraft:sweet_berry_bush","stonecraft:mimic_stone_flower",
        // 其他危险方块
        "minecraft:lava", "minecraft:water", "minecraft:magma_block"
    ]
};