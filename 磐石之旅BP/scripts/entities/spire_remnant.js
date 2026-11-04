import { world, system, Difficulty, MolangVariableMap } from "@minecraft/server";

const BOSS_TYPE = "stonecraft:spire_remnant";
const MINION_TYPE = "stonecraft:stone_block";
const MINION_TAG = "sc:sr_minion";
const MINION_OWNER_PROP = "sc:sr_owner";
const MINION_LIMIT = 9;
// 硬兜底上限（只有异常情况下（例如脚本重载丢标记）才会触发）
const MINION_HARD_CAP = 12;
// 目标搜索半径（与 JSON 的 nearest_attackable_target max_dist 保持一致）
const TARGET_RANGE = 48;

const PROP_PHASE = "sc:sr_phase";
const PROP_DIFF = "sc:sr_diff";
const PROP_CD_SHOCKWAVE = "sc:sr_cd_shockwave";
const PROP_CD_BLINK = "sc:sr_cd_blink";
const PROP_CD_SPIKE = "sc:sr_cd_spike";
const PROP_SPIKE = "sc:sr_spike";
const PROP_MINIONS = "sc:sr_minions";
const PROP_MODE = "sc:sr_mode";

// 远程/近战切换的距离阈值（格）：超过则切远程，低于则切近战
const RANGED_SWITCH_DIST = 6;
const RANGED_SWITCH_HYSTERESIS = 1.5;

// 难度索引 0=Easy 1=Normal 2=Hard
const C = {
    // 二阶段阈值（占总生命百分比）：所有难度统一半血进入
    phase2Threshold: [0.5, 0.5, 0.5],
    // 二阶段常驻缓慢：持续刻
    auraSlowTicks: [30, 40, 60],
    auraRadius: 2.5,
    auraAmplifier: 1,

    shockwave: {
        cooldown: [260, 200, 160],
        radius: [2.0, 2.5, 3.0],
        damage: [2.0, 3.0, 4.0],
        lift: [0.5, 0.8, 1.0],
        slowTicks: 20,
    },
    blink: {
        cooldown: [300, 240, 180],
        minDistSqr: 36,
        maxDistSqr: 256,
        slowTicks: [20, 40, 60],
        offset: 2.0,
        // 取不到 attack 组件时的兜底伤害（与 P1 一致）
        fallbackDamage: [4, 6, 8],
    },
    spike: {
        cooldown: [320, 240, 200],
        // 预警半径（粒子圈）与实际伤害半径分开配置
        warnRadius: [1, 1.5, 2],
        hitRadius: [1.0, 1.8, 3.0],
        warnTicks: 20,
        damage: [3.0, 5.0, 8.0],
        // 凋零统一 Lv1（amplifier 0）
        witherAmplifier: [0, 0, 0],
        witherTicks: [40, 60, 100],
    },
};

const bosses = new Set();


function clampIndex(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(0, Math.min(2, Math.floor(n)));
}

function difficultyIndexOf() {
    try {
        const d = world.getDifficulty();
        if (d === Difficulty.Easy) return 0;
        if (d === Difficulty.Hard) return 2;
        if (d === Difficulty.Normal) return 1;
        return 1;
    } catch {
        return 1;
    }
}

function readNum(entity, key, fallback = 0) {
    try {
        const v = entity.getDynamicProperty(key);
        return typeof v === "number" ? v : fallback;
    } catch {
        return fallback;
    }
}

function writeNum(entity, key, value) {
    try {
        entity.setDynamicProperty(key, value);
    } catch {
    }
}

function readJson(entity, key, fallback) {
    try {
        const raw = entity.getDynamicProperty(key);
        if (typeof raw !== "string" || !raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function writeJson(entity, key, value) {
    try {
        entity.setDynamicProperty(key, JSON.stringify(value));
    } catch {
    }
}

function isPlayer(e) {
    return e?.typeId === "minecraft:player";
}

function isEligiblePlayer(e) {
    if (!isPlayer(e) || !e.isValid) return false;
    try {
        return !e.isCreative && !e.isSpectator;
    } catch {
        return false;
    }
}

function knockback(entity, x, z, vertical) {
    try {
        entity.applyKnockback({ x, z }, vertical);
        return;
    } catch {
    }
    try {
        entity.applyKnockback(x, z, 0, vertical);
    } catch {
    }
}

function knockUp(entity, vertical) {
    knockback(entity, 0, 0, vertical);
}

function particle(dimension, id, location) {
    try {
        dimension.spawnParticle(id, location);
    } catch {
    }
}

let critVars;

function critParticle(dimension, location) {
    try {
        if (!critVars) {
            critVars = new MolangVariableMap();
            critVars.setVector3("direction", { x: 0, y: 1, z: 0 });
        }
        dimension.spawnParticle("minecraft:basic_crit_particle", location, critVars);
    } catch {
        try {
            dimension.spawnParticle("minecraft:basic_crit_particle", location);
        } catch {
        }
    }
}

function sound(dimension, id, location) {
    try {
        dimension.playSound(id, location);
    } catch {
    }
}

function getTarget(boss) {
    try {
        const t = boss.target;
        if (t?.isValid && isPlayer(t)) return t;
    } catch {
        // entity.target 不存在或不可用，走兜底
    }
    try {
        const players = boss.dimension.getPlayers({
            location: boss.location,
            maxDistance: TARGET_RANGE,
        });
        let best;
        let bestDist = Infinity;
        for (const player of players) {
            if (!isEligiblePlayer(player)) continue;
            const dx = player.location.x - boss.location.x;
            const dy = player.location.y - boss.location.y;
            const dz = player.location.z - boss.location.z;
            const d = dx * dx + dy * dy + dz * dz;
            if (d < bestDist) {
                bestDist = d;
                best = player;
            }
        }
        return best;
    } catch {
        return undefined;
    }
}

function getHealth(boss) {
    try {
        return boss.getComponent("minecraft:health");
    } catch {
        return undefined;
    }
}

function loadPhase(boss) {
    return readNum(boss, PROP_PHASE, 1) === 2 ? 2 : 1;
}

function loadDiff(boss) {
    return clampIndex(readNum(boss, PROP_DIFF, difficultyIndexOf()));
}

function tagNearbyMinions(boss) {
    try {
        const dimension = boss.dimension;
        const list = dimension.getEntities({
            type: MINION_TYPE,
            location: boss.location,
            maxDistance: 24,
        });
        for (const minion of list) {
            if (!minion.isValid || minion.hasTag(MINION_TAG)) continue;
            minion.addTag(MINION_TAG);
            try {
                minion.setDynamicProperty(MINION_OWNER_PROP, boss.id);
            } catch {
            }
        }
    } catch {
    }
}

function ownMinions(boss) {
    const result = [];
    try {
        const dimension = boss.dimension;
        const list = dimension.getEntities({
            type: MINION_TYPE,
            location: boss.location,
            maxDistance: 48,
        });
        for (const minion of list) {
            if (!minion.isValid || !minion.hasTag(MINION_TAG)) continue;
            let owner;
            try {
                owner = minion.getDynamicProperty(MINION_OWNER_PROP);
            } catch {
            }
            if (owner === boss.id) result.push(minion);
        }
    } catch {
    }
    return result;
}

function trimMinions(boss) {
    const list = ownMinions(boss);
    if (list.length <= MINION_HARD_CAP) return;
    for (let i = 0; i < list.length - MINION_HARD_CAP; i++) {
        try {
            list[i].kill();
        } catch {
        }
    }
}

const MINION_SOFT_CAP = [1, 3, 6];   // 达到此数卸载召唤组件（Easy/Normal/Hard）
const MINION_RESUME_AT = [1, 3, 5];  // 掉到此数以下重新装回
const PROP_SUMMON_ON = "sc:sr_summon_on";

function isSummonEnabled(boss) {
    try {
        return boss.getDynamicProperty(PROP_SUMMON_ON) !== false;
    } catch {
        return true;
    }
}

function setSummonEnabled(boss, enabled, diff) {
    const names = ["easy", "normal", "hard"];
    try {
        if (enabled) boss.triggerEvent(`stonecraft:summon_on_${names[diff]}`);
        else boss.triggerEvent("stonecraft:summon_off");
        boss.setDynamicProperty(PROP_SUMMON_ON, enabled);
    } catch (error) {
        console.error("[SpireRemnant] summon toggle failed:", error);
    }
}

function updateSummonCap(boss, diff) {
    const count = ownMinions(boss).length;
    const enabled = isSummonEnabled(boss);
    const cap = MINION_SOFT_CAP[diff];
    const resume = MINION_RESUME_AT[diff];
    if (enabled && count >= cap) setSummonEnabled(boss, false, diff);
    else if (!enabled && count < resume) setSummonEnabled(boss, true, diff);
}

function clearMinions(boss) {
    for (const minion of ownMinions(boss)) {
        try {
            minion.kill();
        } catch {
        }
    }
}

function castShockwave(boss, diff) {
    const cfg = C.shockwave;
    const radius = cfg.radius[diff];
    const damage = cfg.damage[diff];
    const lift = cfg.lift[diff];
    const center = boss.location;
    const dimension = boss.dimension;

    let hit = 0;
    try {
        const players = dimension.getPlayers({ location: center, maxDistance: radius });
        for (const player of players) {
            if (!isEligiblePlayer(player)) continue;
            try {
                player.applyDamage(damage, { cause: "entityAttack", damagingEntity: boss });
            } catch {
            }
            knockUp(player, lift);
            try {
                player.addEffect("slowness", cfg.slowTicks, { amplifier: 0, showParticles: true });
            } catch {
            }
            hit++;
        }
    } catch {
    }

    // 环形粒子模拟 Java 的 CRIT 扩散
    const count = 24;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        critParticle(dimension, {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + 0.5,
            z: center.z + Math.sin(angle) * radius,
        });
    }
    sound(dimension, "random.explode", center);
    return hit;
}

//技能：闪现突袭

/** 落点是否安全：脚下可站、自身与头顶两格无碰撞、不是水/岩浆 */
function isSafeTeleport(dimension, x, y, z) {
    try {
        const feet = dimension.getBlock({ x, y: Math.floor(y), z });
        const head = dimension.getBlock({ x, y: Math.floor(y) + 1, z });
        const below = dimension.getBlock({ x, y: Math.floor(y) - 1, z });
        if (!feet || !head || !below) return false;
        if (feet.isAir === false || head.isAir === false) return false;
        if (below.isAir !== false) return false;
        const belowId = below.typeId ?? "";
        if (belowId.includes("lava") || belowId.includes("water")) return false;
        if (feet.typeId && (feet.typeId.includes("lava") || feet.typeId.includes("water"))) return false;
        return true;
    } catch {
        return false;
    }
}

function castBlink(boss, target, diff) {
    const cfg = C.blink;
    const dimension = boss.dimension;

    let look;
    try {
        look = target.getViewDirection();
    } catch {
        return false;
    }
    if (!look) return false;

    const baseX = target.location.x - look.x * cfg.offset;
    const baseZ = target.location.z - look.z * cfg.offset;
    const baseY = target.location.y;

    // 依次尝试：原地、+1、-1 高度，全部失败则放弃
    for (const dy of [0, 1, -1]) {
        const y = baseY + dy;
        if (!isSafeTeleport(dimension, baseX, y, baseZ)) continue;

        particle(dimension, "minecraft:basic_portal_particle", {
            x: boss.location.x, y: boss.location.y + 1, z: boss.location.z,
        });
        try {
            boss.teleport({ x: baseX, y, z: baseZ });
        } catch {
            continue;
        }
        particle(dimension, "minecraft:basic_portal_particle", {
            x: baseX, y: y + 1, z: baseZ,
        });
        sound(dimension, "mob.endermen.portal", { x: baseX, y, z: baseZ });

        // 伤害跟随当前近战攻击力（P1 4/6/8，P2 4/8/12 自动生效）
        let damage = cfg.fallbackDamage[diff];
        try {
            const attack = boss.getComponent("minecraft:attack");
            if (attack && typeof attack.damage === "number") damage = attack.damage;
        } catch {
        }
        try {
            target.applyDamage(damage, { cause: "entityAttack", damagingEntity: boss });
        } catch {
        }
        try {
            target.addEffect("slowness", cfg.slowTicks[diff], { amplifier: 0, showParticles: true });
        } catch {
        }
        return true;
    }
    return false;
}

//技能：湮灭尖刺

function castSpike(boss, target, diff) {
    const cfg = C.spike;
    const r = cfg.warnRadius[diff];
    const origin = target.location;
    const area = {
        x: Math.floor(origin.x) + 0.5,
        y: Math.floor(origin.y),
        z: Math.floor(origin.z) + 0.5,
        r,
        left: cfg.warnTicks,
    };
    writeJson(boss, PROP_SPIKE, area);

    const dimension = boss.dimension;
    // 预警粒子（圆形区域，判定式 x*x+z*z <= r*r+r）
    for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
            if (dx * dx + dz * dz > r * r + r) continue;
            particle(dimension, "minecraft:blue_flame_particle", {
                x: area.x + dx, y: area.y + 0.1, z: area.z + dz,
            });
        }
    }
    sound(dimension, "mob.evocation_illager.prepare_attack", boss.location);
    return true;
}

function tickSpike(boss, diff) {
    const area = readJson(boss, PROP_SPIKE, undefined);
    if (!area || typeof area.left !== "number") return;

    const dimension = boss.dimension;
    const cfg = C.spike;

    area.left -= 2;
    if (area.left > 0) {
        // 预警期的持续粒子
        for (let dx = -area.r; dx <= area.r; dx++) {
            for (let dz = -area.r; dz <= area.r; dz++) {
                if (dx * dx + dz * dz > area.r * area.r + area.r) continue;
                if ((dx + dz) % 2 !== 0) continue;
                particle(dimension, "minecraft:blue_flame_particle", {
                    x: area.x + dx, y: area.y + 0.2, z: area.z + dz,
                });
            }
        }
        writeJson(boss, PROP_SPIKE, area);
        return;
    }

    // 引爆：以区域中心为圆心，半径取 hitRadius（与预警半径分开配置）
    const hitRadius = cfg.hitRadius[diff];
    const damage = cfg.damage[diff];
    const witherAmp = cfg.witherAmplifier[diff];
    const witherTicks = cfg.witherTicks[diff];

    let hit = 0;
    try {
        const players = dimension.getPlayers({
            location: { x: area.x, y: area.y, z: area.z },
            maxDistance: hitRadius,
        });
        for (const player of players) {
            if (!isEligiblePlayer(player)) continue;
            try {
                player.applyDamage(damage, { cause: "entityAttack", damagingEntity: boss });
            } catch {
            }
            try {
                player.addEffect("wither", witherTicks, { amplifier: witherAmp, showParticles: true });
            } catch {
            }
            hit++;
        }
    } catch {
    }

    // 引爆粒子：dragon_breath_fire 需要 variable.actor（实体），spawnParticle 无法提供，
    // 改用已验证无变量依赖的 blue_flame_particle 叠加 explosion_manual
    for (let i = -area.r; i <= area.r; i++) {
        for (let j = -area.r; j <= area.r; j++) {
            if (i * i + j * j > area.r * area.r + area.r) continue;
            particle(dimension, "minecraft:blue_flame_particle", {
                x: area.x + i, y: area.y + 0.3, z: area.z + j,
            });
        }
    }
    particle(dimension, "minecraft:explosion_manual", { x: area.x, y: area.y + 0.5, z: area.z });
    sound(dimension, "random.explode", { x: area.x, y: area.y, z: area.z });

    try {
        boss.setDynamicProperty(PROP_SPIKE, "");
    } catch {
    }
    return hit;
}

//阶段

function enterPhaseTwo(boss, diff) {
    const names = ["easy", "normal", "hard"];
    try {
        boss.triggerEvent(`stonecraft:enter_phase_two_${names[diff]}`);
    } catch (error) {
        console.error("[SpireRemnant] enter_phase_two failed:", error);
    }
    writeNum(boss, PROP_PHASE, 2);

    const dimension = boss.dimension;
    const center = boss.location;

    // 一次性击退：4 格内玩家，单位向量 ×1.2 + 垂直 0.6
    try {
        const players = dimension.getPlayers({ location: center, maxDistance: 4 });
        for (const player of players) {
            if (!isEligiblePlayer(player)) continue;
            const dx = player.location.x - center.x;
            const dz = player.location.z - center.z;
            const len = Math.hypot(dx, dz) || 1;
            knockback(player, (dx / len) * 1.2, (dz / len) * 1.2, 0.6);
        }
    } catch {
    }

    // 广播
    try {
        for (const player of dimension.getPlayers({ location: center, maxDistance: 32 })) {
            try {
                player.sendMessage("§5高塔余裔进入狂暴阶段");
            } catch {
            }
        }
    } catch {
    }

    sound(dimension, "mob.wither.spawn", center);
    particle(dimension, "minecraft:explosion_manual", { x: center.x, y: center.y + 1, z: center.z });
    particle(dimension, "minecraft:explosion_manual", { x: center.x + 1, y: center.y + 1.5, z: center.z });
    particle(dimension, "minecraft:explosion_manual", { x: center.x - 1, y: center.y + 0.5, z: center.z });
}

function applyAura(boss, diff) {
    const dimension = boss.dimension;
    const center = boss.location;
    const ticks = C.auraSlowTicks[diff];
    try {
        const players = dimension.getPlayers({ location: center, maxDistance: C.auraRadius });
        for (const player of players) {
            if (!isEligiblePlayer(player)) continue;
            try {
                player.addEffect("slowness", ticks, {
                    amplifier: C.auraAmplifier,
                    showParticles: true,
                });
            } catch {
            }
        }
    } catch {
    }
}

//近战/远程切换
function loadMode(boss) {
    try {
        const m = boss.getDynamicProperty(PROP_MODE);
        return m === "ranged" ? "ranged" : "melee";
    } catch {
        return "melee";
    }
}

function setMode(boss, mode, diff) {
    const names = ["easy", "normal", "hard"];
    try {
        if (mode === "ranged") {
            boss.triggerEvent(`stonecraft:mode_ranged_${names[diff]}`);
        } else {
            boss.triggerEvent("stonecraft:mode_melee");
        }
        writeNum(boss, PROP_MODE, mode === "ranged" ? 1 : 0);
    } catch (error) {
        console.error("[SpireRemnant] mode switch failed:", error);
    }
}

function updateMode(boss, target, diff) {
    if (!target) return;
    let dist;
    try {
        const dx = target.location.x - boss.location.x;
        const dy = target.location.y - boss.location.y;
        const dz = target.location.z - boss.location.z;
        dist = Math.hypot(dx, dy, dz);
    } catch {
        return;
    }
    const current = loadMode(boss);
    if (current === "ranged" && dist < RANGED_SWITCH_DIST - RANGED_SWITCH_HYSTERESIS) {
        setMode(boss, "melee", diff);
    } else if (current === "melee" && dist > RANGED_SWITCH_DIST + RANGED_SWITCH_HYSTERESIS) {
        setMode(boss, "ranged", diff);
    }
}

//初始化

function initBoss(boss) {
    if (!boss?.isValid) return;
    let diff = readNum(boss, PROP_DIFF, NaN);
    if (!Number.isFinite(diff)) {
        diff = difficultyIndexOf();
        writeNum(boss, PROP_DIFF, diff);
    }
    diff = clampIndex(diff);

    // 首次生成给随机初始冷却，避免开场三连（问题 6）
    if (!Number.isFinite(readNum(boss, PROP_CD_SHOCKWAVE, NaN))) {
        writeNum(boss, PROP_CD_SHOCKWAVE, Math.floor(C.shockwave.cooldown[diff] * (0.4 + Math.random() * 0.2)));
        writeNum(boss, PROP_CD_BLINK, Math.floor(C.blink.cooldown[diff] * (0.4 + Math.random() * 0.2)));
        writeNum(boss, PROP_CD_SPIKE, Math.floor(C.spike.cooldown[diff] * (0.4 + Math.random() * 0.2)));
    }

    if (!Number.isFinite(readNum(boss, PROP_PHASE, NaN))) writeNum(boss, PROP_PHASE, 1);

    // 防御：已记录为二阶段但组件组丢了（读档异常）时补触发
    if (loadPhase(boss) === 2) {
        try {
            const attack = boss.getComponent("minecraft:attack");
            const expect = [8, 12, 17][diff];
            if (attack && attack.damage !== expect) enterPhaseTwo(boss, diff);
        } catch {
        }
    }
    bosses.add(boss);
}

//主循环

function tickBoss(boss) {
    if (!boss?.isValid) {
        bosses.delete(boss);
        return;
    }
    const diff = loadDiff(boss);
    let phase = loadPhase(boss);
    const health = getHealth(boss);

    // 阶段切换
    if (phase === 1 && health && health.currentValue > 0) {
        const max = health.effectiveMax || health.defaultValue || 150;
        if (health.currentValue <= max * C.phase2Threshold[diff]) {
            enterPhaseTwo(boss, diff);
            phase = 2;
        }
    }

    // P2 常驻光环
    if (phase === 2) applyAura(boss, diff);

    const target = getTarget(boss);

    // 远程/近战按距离切换（解决 melee 抢占 ranged 的问题）
    if (target) updateMode(boss, target, diff);

    // 冷却推进（每 2 tick 调用一次）
    const cdShockwave = readNum(boss, PROP_CD_SHOCKWAVE, 0) - 2;
    const cdBlink = readNum(boss, PROP_CD_BLINK, 0) - 2;
    const cdSpike = readNum(boss, PROP_CD_SPIKE, 0) - 2;

    let nextShockwave = Math.max(0, cdShockwave);
    let nextBlink = Math.max(0, cdBlink);
    let nextSpike = Math.max(0, cdSpike);

    if (target) {
        // 冲击波：有目标才放（问题 7）
        if (nextShockwave <= 0) {
            const hit = castShockwave(boss, diff);
            if (hit > 0) nextShockwave = C.shockwave.cooldown[diff];
            else nextShockwave = 20; // 范围内没人，20 tick 后重试
        }

        // 闪现：仅 P1，且距离在 6~16 格之间
        if (phase === 1 && nextBlink <= 0) {
            const dx = target.location.x - boss.location.x;
            const dy = target.location.y - boss.location.y;
            const dz = target.location.z - boss.location.z;
            const distSqr = dx * dx + dy * dy + dz * dz;
            if (distSqr > C.blink.minDistSqr && distSqr < C.blink.maxDistSqr) {
                if (castBlink(boss, target, diff)) nextBlink = C.blink.cooldown[diff];
                else nextBlink = 20; // 落点不安全，稍后重试
            }
        }

        // 尖刺：仅 P2
        if (phase === 2 && nextSpike <= 0 && !readJson(boss, PROP_SPIKE, undefined)) {
            castSpike(boss, target, diff);
            nextSpike = C.spike.cooldown[diff];
        }
    }

    // 只在数值变化时写动态属性，减少 IO
    if (nextShockwave !== readNum(boss, PROP_CD_SHOCKWAVE, -1)) writeNum(boss, PROP_CD_SHOCKWAVE, nextShockwave);
    if (nextBlink !== readNum(boss, PROP_CD_BLINK, -1)) writeNum(boss, PROP_CD_BLINK, nextBlink);
    if (nextSpike !== readNum(boss, PROP_CD_SPIKE, -1)) writeNum(boss, PROP_CD_SPIKE, nextSpike);

    // 尖刺预警推进
    tickSpike(boss, diff);

    // 召唤物归属 + 上限（JSON 负责生成，这里按数量装卸召唤组件）
    tagNearbyMinions(boss);
    updateSummonCap(boss, diff);
    trimMinions(boss);
}

// 生命周期

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (entity?.typeId !== BOSS_TYPE) return;
    // JSON 的 entity_spawned 事件需要一 tick 生效，延迟初始化
    system.runTimeout(() => initBoss(entity), 2);
});

world.afterEvents.entityLoad.subscribe((event) => {
    const entity = event.entity;
    if (entity?.typeId !== BOSS_TYPE) return;
    initBoss(entity);
});

world.afterEvents.entityDie.subscribe((event) => {
    const dead = event.deadEntity;
    if (dead?.typeId !== BOSS_TYPE) return;
    bosses.delete(dead);
    clearMinions(dead);
    // 血条随实体消失；未引爆的技能状态一并清掉
    try {
        dead.setDynamicProperty(PROP_SPIKE, "");
    } catch {
    }
});

// 主循环：每 2 tick
system.runInterval(() => {
    if (bosses.size === 0) return;
    for (const boss of [...bosses]) {
        try {
            tickBoss(boss);
        } catch (error) {
            console.error("[SpireRemnant] tick failed:", error);
        }
    }
}, 2);
