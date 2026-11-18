import { world } from "@minecraft/server";

//原版监守者没有我们的战利品表。这里不改原版 JSON，死后用脚本生成一份额外掉落。
//不用 /loot 命令：命令的 loot_table 路径格式在两种写法之间摇摆，失败还会静默。
const LOOT_TABLE_PATH = "entities/warden_ieb";

world.afterEvents.entityDie.subscribe((event) => {
    const dead = event.deadEntity;
    if (dead?.typeId !== "minecraft:warden") return;

    const dimension = dead.dimension;
    const location = dead.location;

    const manager = world.getLootTableManager();
    const table = manager.getLootTable(LOOT_TABLE_PATH);
    if (!table) {
        console.warn(`[Warden] loot table not found: ${LOOT_TABLE_PATH}`);
        return;
    }

    const drops = manager.generateLootFromTable(table);
    for (const item of drops) {
        dimension.spawnItem(item, location);
    }
});
