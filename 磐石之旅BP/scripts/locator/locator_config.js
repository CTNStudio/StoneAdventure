// 词条 id 必须带命名空间；kind 决定用群系搜索还是结构命令
// structure 是要 /structure load 的文件名（放在 BP 的 structures/ 下）
export const locatorEntries = [
    { kind: "biome", id: "stonecraft:barren_stone_fields" },
    { kind: "biome", id: "stonecraft:stone_hoodoo_fields" },
    { kind: "structure", id: "stonecraft:ancient_stone_altar", structure: "mystructure:find_ancient_stone_altar" },
    { kind: "structure", id: "stonecraft:snatcher_camp", structure: "mystructure:find_snatcher_camp" },
    { kind: "structure", id: "stonecraft:stone_battle_tower", structure: "mystructure:find_stone_battle_tower" },
    { kind: "structure", id: "stonecraft:stone_sacrifice_land", structure: "mystructure:find_stone_sacrifice_land" },
    { kind: "structure", id: "stonecraft:sunken_stone_altar", structure: "mystructure:find_sunken_stone_altar" }
];

// 单条可加 cost / cooldown 覆盖这里
export const locatorCost = {
    stonePoint: 50,
    cooldownTicks: 6000
};
