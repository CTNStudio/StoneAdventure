import { system } from "@minecraft/server";

// 群系有原生搜索接口，结构靠加载一个内含常开命令方块的结构文件
export function locateBiome(player, id) {
    try {
        const pos = player.dimension.calculateClosestBiomeFromSeed(player.location, id);
        if (!pos) return { ok: false, key: "stonecraft.locator.fail_biome" };
        const dx = pos.x - player.location.x;
        const dz = pos.z - player.location.z;
        return { ok: true, location: pos, distance: Math.round(Math.sqrt(dx * dx + dz * dz)) };
    } catch (error) {
        console.error("[Locator] biome search failed", error);
        return { ok: false, key: "stonecraft.locator.fail_biome" };
    }
}

export function locateStructure(player, entry) {
    const name = entry.structure;
    if (!name) return { ok: false, key: "stonecraft.locator.fail_structure" };

    const x = Math.floor(player.location.x);
    const z = Math.floor(player.location.z);
    // 放在基岩层，命令方块跑完当 tick 就换回基岩，正常游玩看不到
    const y = -64;

    try {
        // 玩家可能关掉了命令方块消息，先打开，否则命令方块跑了也看不到结果
        player.runCommand("gamerule commandblockoutput true");
        const result = player.runCommand(`structure load ${name} ${x} ${y} ${z}`);
        system.runTimeout(() => {
            try {
                player.dimension.getBlock({ x, y, z })?.setType("minecraft:bedrock");
            } catch (error) {
                console.error("[Locator] restore bedrock failed", error);
            }
        }, 1);
        if (!result || result.successCount <= 0) {
            return { ok: false, key: "stonecraft.locator.fail_structure" };
        }
        return { ok: true };
    } catch (error) {
        console.error("[Locator] structure load failed", error);
        return { ok: false, key: "stonecraft.locator.fail_structure" };
    }
}

export function isInsideBiome(player, id, location) {
    try {
        if (!location) return false;
        const dx = location.x - player.location.x;
        const dz = location.z - player.location.z;
        return Math.sqrt(dx * dx + dz * dz) < 32;
    } catch {
        return false;
    }
}
