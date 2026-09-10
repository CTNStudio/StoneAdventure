
export const STONE_TIDE_CONFIG = {
    // 石潮爆发概率（0~1）
    triggerChance: 0.3,
    // 每个玩家每次生成生物数量
    spawnCountPerPlayer: 3,
    // 生成半径（格）
    minSpawnRadius: 16,
    spawnRadius: 32,
    // 可生成的生物类型列表
    mobTypes: [
        "stonecraft:stone_guard",
        "stonecraft:stone_shooter",
        "stonecraft:stone_fissuring_husk"
        // 可继续添加
    ]
};