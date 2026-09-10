import { world, system } from "@minecraft/server";
import { STONE_TIDE_CONFIG } from "./stone_tide_config.js";

const NAMESPACE = "stonecraft";
const BOSS_KILLED_KEY = `${NAMESPACE}:totem_defeated`;
const TIDE_ACTIVE_KEY = `${NAMESPACE}:tide_active`;

const WEEKEND_DAYS = [0, 6];    // 0=周日, 6=周六
const NIGHT_START = 13000;      // 夜晚开始（晚上7点）
const NIGHT_END = 24000;        // 天亮（早上6点）

let tideActive = false;
let tideSpawnInterval = null;
let sleepCheckInterval = null;

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
    }, 20); // 每秒检查一次
}

function stopSleepBlocking() {
    if (sleepCheckInterval !== null) {
        system.clearRun(sleepCheckInterval);
        sleepCheckInterval = null;
    }
}

// ---------- 石潮控制 ----------
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
        }, 100); // 5秒间隔
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

//事件监听
world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    if (deadEntity.typeId === "stonecraft:ancient_stone_totem") {
        world.setDynamicProperty(BOSS_KILLED_KEY, true);
        world.sendMessage({ translate: "sc.tide.totem_died" });
    }
});

// 每 tick 检查触发条件
system.runInterval(() => {
    const bossKilled = world.getDynamicProperty(BOSS_KILLED_KEY) ?? false;
    if (!bossKilled || tideActive) return;
    const day = world.getDay();
    const timeOfDay = world.getTimeOfDay();
    if (shouldTriggerTide(day, timeOfDay)) {
        startStoneTide();
    }
}, 20);
function getSpawnY(dimension, x, z, playerY) {
    // 以玩家 y 为起点，向上下各搜索 16 格，找到第一个可站立的方块顶部
    for (let offset = 0; offset <= 16; offset++) {
        for (const y of [playerY + offset, playerY - offset]) {
            try {
                const block = dimension.getBlock({ x, y, z });
                const above = dimension.getBlock({ x, y: y + 1, z });
                const above2 = dimension.getBlock({ x, y: y + 2, z });
                if (
                    block && block.typeId !== "minecraft:air" &&
                    above && above.typeId === "minecraft:air" &&
                    above2 && above2.typeId === "minecraft:air"
                ) {
                    return y + 1;
                }
            } catch (_) {}
        }
    }
    return playerY; // 找不到合适位置则退回玩家高度
}

// 玩家加入时若石潮已激活，阻塞功能已经在循环中覆盖，无需额外操作
export { tideActive };