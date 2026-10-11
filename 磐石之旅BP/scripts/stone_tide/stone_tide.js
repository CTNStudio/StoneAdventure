import { world, system } from "@minecraft/server";
import { STONE_TIDE_CONFIG } from "./stone_tide_config.js";

const NAMESPACE = "stonecraft";
const BOSS_KILLED_KEY = `${NAMESPACE}:totem_defeated`;
const TIDE_ACTIVE_KEY = `${NAMESPACE}:tide_active`;

const WEEKEND_DAYS = [0, 6];
const NIGHT_START = 13000;
const NIGHT_END = 22813;

let tideActive = false;
let tideSpawnInterval = null;
let sleepCheckInterval = null;
let lastCheckedNightKey = null;

function shouldTriggerTide(day, timeOfDay) {
    if (timeOfDay < NIGHT_START || timeOfDay >= NIGHT_END) return false;
    const dayOfWeek = day % 7;
    if (!WEEKEND_DAYS.includes(dayOfWeek)) return false;
    return Math.random() < STONE_TIDE_CONFIG.triggerChance;
}

function getSurfaceHeight(dimension, x, z) {
    try {
        for (let y = 320; y > -64; y--) {
            const block = dimension.getBlock({ x, y, z });
            if (block && block.typeId !== "minecraft:air") {
                return y + 1;
            }
        }
    } catch (_) {}
    return undefined;
}
function getGroundBlockId(dimension, x, y, z) {
    for (let dy = 1; dy <= 4; dy++) {
        try {
            const block = dimension.getBlock({ x, y: y - dy, z });
            if (block && block.typeId !== "minecraft:air") {
                return block.typeId;
            }
        } catch (_) {}
    }
    return "minecraft:air";
}

function spawnMobsAroundPlayers() {
    const players = world.getAllPlayers();
    if (players.length === 0) return;
    const dimension = world.getDimension("overworld");
    const { mobTypes, spawnRadius, minSpawnRadius, spawnCountPerPlayer } = STONE_TIDE_CONFIG;

    for (const player of players) {
        if (!player.isValid) continue;
        const pos = player.location;
        const minDist = Math.max(0, minSpawnRadius);
        const maxDist = Math.max(minDist + 1, spawnRadius);

        for (let i = 0; i < spawnCountPerPlayer; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const dist = minDist + Math.random() * (maxDist - minDist);
            const x = pos.x + Math.cos(angle) * dist;
            const z = pos.z + Math.sin(angle) * dist;

            const y = getSpawnY(dimension, x, z, pos.y);
            if (y === null) continue;  // 找不到合适位置，跳过

            const type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
            try {
                dimension.spawnEntity(type, { x, y, z });
            } catch (_) {}
        }
    }
}

//睡眠阻止
function startSleepBlocking() {
    if (sleepCheckInterval !== null) return;
    sleepCheckInterval = system.runInterval(() => {
        if (!tideActive) {
            system.clearRun(sleepCheckInterval);
            sleepCheckInterval = null;
            return;
        }
        for (const player of world.getAllPlayers()) {
            if (player.isSleeping) {
                const loc = player.location;
                // 微小传送强制唤醒
                player.teleport({ x: loc.x, y: loc.y + 0.01, z: loc.z });
                player.sendMessage({ translate: "sc.tide.sleep_blocked" });
            }
        }
    }, 20);
}

function stopSleepBlocking() {
    if (sleepCheckInterval !== null) {
        system.clearRun(sleepCheckInterval);
        sleepCheckInterval = null;
    }
}

export function startStoneTide() {
    if (tideActive) return;
    tideActive = true;
    world.setDynamicProperty(TIDE_ACTIVE_KEY, true);
    world.sendMessage({ translate: "sc.tide.tide_begins" });
    startSleepBlocking();

    if (tideSpawnInterval === null) {
        tideSpawnInterval = system.runInterval(() => {
            if (!tideActive) {
                system.clearRun(tideSpawnInterval);
                tideSpawnInterval = null;
                return;
            }
            const timeOfDay = world.getTimeOfDay();
            if (timeOfDay >= NIGHT_START && timeOfDay < NIGHT_END) {
                spawnMobsAroundPlayers();
            } else {
                stopStoneTide();
            }
        }, 100);
    }
}

export function stopStoneTide() {
    if (!tideActive) return;
    tideActive = false;
    world.setDynamicProperty(TIDE_ACTIVE_KEY, false);
    world.sendMessage({ translate: "sc.tide.tide_ends" });
    if (tideSpawnInterval) {
        system.clearRun(tideSpawnInterval);
        tideSpawnInterval = null;
    }
    stopSleepBlocking();
}

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    if (deadEntity.typeId === "stonecraft:ancient_stone_totem") {
        world.setDynamicProperty(BOSS_KILLED_KEY, true);
        world.sendMessage({ translate: "sc.tide.totem_died" });
    }
});

system.runInterval(() => {
    const bossKilled = world.getDynamicProperty(BOSS_KILLED_KEY) ?? false;
    if (!bossKilled || tideActive) return;

    const day = world.getDay();
    const timeOfDay = world.getTimeOfDay();

    // 白天：重置本夜晚判定标记
    if (timeOfDay < NIGHT_START || timeOfDay >= NIGHT_END) {
        lastCheckedNightKey = null;
        return;
    }
    const nightKey = day;
    if (lastCheckedNightKey === nightKey) return;
    lastCheckedNightKey = nightKey;

    if (shouldTriggerTide(day, timeOfDay)) {
        startStoneTide();
    }
}, 20);

function getSpawnY(dimension, x, z, playerY) {
    const { avoidBlockTypes } = STONE_TIDE_CONFIG;

    // 获取该 XZ 的最高方块
    let topBlock;
    try {
        topBlock = dimension.getTopmostBlock({ x, z });
    } catch (_) {
        return null;
    }
    if (!topBlock) return null;

    const surfaceY = topBlock.y;
    const isUnderground = playerY < surfaceY - 1;

    if (isUnderground) {
        // 玩家在地下：从玩家所在高度向下搜索可站立位置
        for (let y = Math.floor(playerY); y >= Math.floor(playerY) - 16; y--) {
            const ground = tryGetBlock(dimension, x, y - 1, z);
            if (!ground) continue;
            if (avoidBlockTypes.includes(ground.typeId)) continue;
            if (STONE_TIDE_CONFIG.avoidBlockTypes.includes(ground.typeId)) continue;
            if (isAirOrPassable(dimension, x, y, z) && isAirOrPassable(dimension, x, y + 1, z)) {
                return y;
            }
        }
        return null;
    }

    // 玩家在地面或以上：从地表向下搜索第一个"可站立"的地面
    for (let y = surfaceY; y >= surfaceY - 4; y--) {
        const ground = tryGetBlock(dimension, x, y, z);
        if (!ground) continue;
        if (avoidBlockTypes.includes(ground.typeId)) return null;
        if (STONE_TIDE_CONFIG.avoidBlockTypes.includes(ground.typeId)) continue;   // 栅栏/作物等，继续向下
        // 确认上方两格都是可穿过的
        if (isAirOrPassable(dimension, x, y + 1, z) && isAirOrPassable(dimension, x, y + 2, z)) {
            return y + 1;
        }
    }
    return null;
}

function isAirOrPassable(dimension, x, y, z) {
    const block = tryGetBlock(dimension, x, y, z);
    if (!block) return false;
    const id = block.typeId;
    if (id === "minecraft:air") return true;
    // 可以视作"可穿过"的方块（植物、草、花等）
    return id.includes("grass") || id.includes("flower") || id === "minecraft:short_grass";
}

function tryGetBlock(dimension, x, y, z) {
    try {
        return dimension.getBlock({ x, y, z });
    } catch (_) {
        return undefined;
    }
}

export { tideActive };