import { world, system } from "@minecraft/server";

const BOSS_TYPE = "stonecraft:abyss_eye";
const PUPIL_TYPE = "stonecraft:abyss_eye_pupil";

const PHASE2_TAG = "sc:abyss_phase2";
const PHASE3_TAG = "sc:abyss_phase3";

const EROSION_KEY = "stonecraft:abyss_erosion";
const MARK_KEY = "stonecraft:abyss_echo_mark";

const POOL_BASE = 350;
const THRESHOLD_P2 = 175;    // 350 的 50%
const THRESHOLD_P3 = 52;     // 350 的 15%
const THRESHOLD_FRENZY = 105;    // 700 的 15%
const PUPIL_CAP = 6;
const TRANSFORM_TICKS = 80;    // 阶段转换 4 秒
const HEAL_TICKS = 40;    // 前 2 秒把血回满

const states = new Map();
const playerTimers = new Map();

function particle(dimension, location) {
    dimension.spawnParticle("stonecraft:abyss_soul", location);
}

function isPlayer(entity) {
    return entity?.typeId === "minecraft:player";
}

function shake(dimension, location, radius) {
    for (const player of dimension.getPlayers({ location, maxDistance: radius })) {
        player.runCommand("camerashake add @s 0.35 0.5 positional");
    }
}

function stateOf(boss) {
    let st = states.get(boss.id);
    if (st) return st;

    const phase = boss.hasTag(PHASE3_TAG) ? 3 : boss.hasTag(PHASE2_TAG) ? 2 : 1;
    const now = system.currentTick;
    st = {
        phase,
        nextPhase: 0,
        transformingUntil: 0,
        healTo: POOL_BASE,
        summonNext: now + 120,
        devourNext: now + 120,
        darkNext: 0,
        frenzy: false,
        frenzyUntil: 0
    };
    states.set(boss.id, st);
    return st;
}

function beginTransform(boss, st, nextPhase) {
    st.nextPhase = nextPhase;
    st.transformingUntil = system.currentTick + TRANSFORM_TICKS;
    st.healTo = POOL_BASE;
    boss.addTag(nextPhase === 2 ? PHASE2_TAG : PHASE3_TAG);
    boss.triggerEvent(nextPhase === 2 ? "stonecraft:enter_phase2" : "stonecraft:enter_phase3");

    shake(boss.dimension, boss.location, 64);
    boss.dimension.playSound("mob.warden.roar", boss.location);
    for (let i = 0; i < 8; i++) {
        particle(boss.dimension, {
            x: boss.location.x + (Math.random() - 0.5) * 3,
            y: boss.location.y + Math.random() * 2,
            z: boss.location.z + (Math.random() - 0.5) * 3
        });
    }
}

function finishTransform(boss, st) {
    st.phase = st.nextPhase;
    st.nextPhase = 0;
    st.transformingUntil = 0;
    st.summonNext = system.currentTick + 80;
    st.devourNext = system.currentTick + 120;
    boss.dimension.playSound("mob.warden.sonic_boom", boss.location);
}

function addErosion(player) {
    const layer = player.getDynamicProperty(EROSION_KEY) ?? 0;
    if (layer < 10) player.setDynamicProperty(EROSION_KEY, layer + 1);
    const timer = playerTimers.get(player.id);
    if (timer) {
        timer.combatUntil = system.currentTick + 100;
    } else {
        playerTimers.set(player.id, { combatUntil: system.currentTick + 100 });
    }
}

function addMark(player) {
    const layer = player.getDynamicProperty(MARK_KEY) ?? 0;
    if (layer < 5) player.setDynamicProperty(MARK_KEY, layer + 1);
}

function spawnPupil(boss) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 2;    // 2~4 格
    const loc = {
        x: boss.location.x + Math.cos(angle) * radius,
        y: boss.location.y + Math.random(),
        z: boss.location.z + Math.sin(angle) * radius
    };
    boss.dimension.spawnEntity(PUPIL_TYPE, loc);
    particle(boss.dimension, loc);
}

function soulLine(boss, from) {
    const to = boss.location;
    for (let i = 1; i <= 8; i++) {
        const t = i / 9;
        particle(boss.dimension, {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            z: from.z + (to.z - from.z) * t
        });
    }
}

function devour(boss, st, health, target) {
    const targetHealth = target.getComponent("minecraft:health");
    const gain = targetHealth ? targetHealth.currentValue : 0;
    const typeId = target.typeId;

    soulLine(boss, target.location);
    target.remove();

    health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + gain));
    particle(boss.dimension, boss.location);

    if (typeId === "minecraft:warden") {
        boss.triggerEvent("stonecraft:sonic_start");
        boss.dimension.playSound("mob.warden.sonic_charge", boss.location);
    } else {
        st.frenzyUntil = system.currentTick + 200;    // 战狂 10 秒
        boss.dimension.playSound("mob.warden.attack_impact", boss.location);
    }
}

function tickBoss(boss) {
    if (!boss.isValid) return;
    const st = stateOf(boss);
    const health = boss.getComponent("minecraft:health");
    if (!health) return;

    const now = system.currentTick;

    if (st.transformingUntil) {
        if (health.currentValue > st.healTo) {
            health.setCurrentValue(st.healTo);
        } else if (health.currentValue < st.healTo) {
            const step = Math.max(1, Math.ceil(st.healTo / (HEAL_TICKS / 4)));
            health.setCurrentValue(Math.min(st.healTo, health.currentValue + step));
        }
        if (now >= st.transformingUntil) finishTransform(boss, st);
        return;
    }

    if (st.nextPhase) {
        beginTransform(boss, st, st.nextPhase);
        return;
    }

    const hp = health.currentValue;
    if (st.phase === 1 && hp <= THRESHOLD_P2 + 1) {
        beginTransform(boss, st, 2);
        return;
    }
    if (st.phase === 2 && hp <= THRESHOLD_P3 + 1) {
        beginTransform(boss, st, 3);
        return;
    }

    const players = boss.dimension.getPlayers({ location: boss.location, maxDistance: 32 });
    if (!players.length) return;

    if (st.phase === 3) {
        const frenzyNow = hp <= THRESHOLD_FRENZY || now < st.frenzyUntil;
        if (frenzyNow && !st.frenzy) {
            st.frenzy = true;
            boss.triggerEvent("stonecraft:frenzy_start");
        } else if (!frenzyNow && st.frenzy) {
            st.frenzy = false;
            boss.triggerEvent("stonecraft:frenzy_end");
        }
    }

    if (st.phase >= 2 && now >= st.summonNext) {
        st.summonNext = now + (st.phase === 3 ? 200 : 280);    // 10 / 14 秒
        const near = boss.dimension.getEntities({ location: boss.location, maxDistance: 24, type: PUPIL_TYPE });
        if (near.length < PUPIL_CAP) {
            const count = Math.min(2 + Math.floor(Math.random() * 3), PUPIL_CAP - near.length);    // 2~4 只
            for (let i = 0; i < count; i++) spawnPupil(boss);
            boss.dimension.playSound("mob.warden.listening", boss.location);
        }
    }

    if (st.phase === 3 && hp <= POOL_BASE && now >= st.devourNext) {
        st.devourNext = now + 60 + Math.floor(Math.random() * 40);    // 3~5 秒
        const targets = boss.dimension.getEntities({
            location: boss.location,
            maxDistance: 8,
            families: ["abyss_creatures", "warden"]
        });
        if (targets.length) devour(boss, st, health, targets[0]);
    }

    if (now >= st.darkNext) {
        st.darkNext = now + 20;
        for (const player of boss.dimension.getPlayers({ location: boss.location, maxDistance: 16 })) {
            player.addEffect("darkness", 100, { amplifier: 0, showParticles: false });
        }
    }

    let nearest = players[0];
    let nearestDist = Infinity;
    for (const player of players) {
        const d = (player.location.x - boss.location.x) ** 2 + (player.location.z - boss.location.z) ** 2;
        if (d < nearestDist) {
            nearestDist = d;
            nearest = player;
        }
    }
    boss.setRotation({
        x: 0,
        y: Math.atan2(-(nearest.location.x - boss.location.x), nearest.location.z - boss.location.z) * 180 / Math.PI
    });
}

system.runInterval(() => {
    const seen = new Set();
    for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
        const bosses = world.getDimension(dimensionId).getEntities({ type: BOSS_TYPE });
        for (const boss of bosses) {
            seen.add(boss.id);
            tickBoss(boss);
        }
    }
    for (const id of states.keys()) {
        if (!seen.has(id)) states.delete(id);
    }
}, 4);

system.runInterval(() => {
    const now = system.currentTick;
    for (const player of world.getAllPlayers()) {
        const mark = player.getDynamicProperty(MARK_KEY) ?? 0;
        const erosion = player.getDynamicProperty(EROSION_KEY) ?? 0;
        let timer = playerTimers.get(player.id);
        if (!timer || !timer.last) {
            timer = {
                last: player.location,
                still: 0,
                combatUntil: timer?.combatUntil ?? 0,
                decayAt: timer?.decayAt ?? now
            };
            playerTimers.set(player.id, timer);
        }

        const moved = Math.abs(player.location.x - timer.last.x) > 0.08
            || Math.abs(player.location.z - timer.last.z) > 0.08;
        timer.last = player.location;

        if (moved) {
            timer.still = 0;
            if (mark > 0 && mark < 5) player.setDynamicProperty(MARK_KEY, mark + 1);
        } else {
            timer.still += 1;
            if (timer.still >= 3) {
                timer.still = 0;
                if (mark > 0) player.setDynamicProperty(MARK_KEY, mark - 1);
            }
        }

        if (erosion > 0 && now >= timer.combatUntil && now >= timer.decayAt) {
            timer.decayAt = now + 60;    // 3 秒一层
            player.setDynamicProperty(EROSION_KEY, erosion - 1);
        }
    }
}, 10);

world.afterEvents.playerLeave.subscribe((event) => {
    playerTimers.delete(event.playerId);
});

world.beforeEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity;
    const attacker = event.damageSource?.damagingEntity;

    if (victim?.typeId === BOSS_TYPE) {
        const st = states.get(victim.id);
        if (!st) return;

        if (st.transformingUntil) {
            event.cancel = true;
            return;
        }

        const threshold = st.phase === 1 ? THRESHOLD_P2 : st.phase === 2 ? THRESHOLD_P3 : 0;
        if (!threshold) return;

        const health = victim.getComponent("minecraft:health");
        if (!health) return;

        const room = health.currentValue - threshold;
        if (room <= 0 || event.damage >= room) {
            event.cancel = true;
            st.nextPhase = st.phase + 1;
        }
        return;
    }

    if (!isPlayer(victim) || attacker?.typeId !== BOSS_TYPE) return;

    addErosion(victim);
    const st = states.get(attacker.id);
    if (st && st.phase >= 2) addMark(victim);

    const erosion = victim.getDynamicProperty(EROSION_KEY) ?? 0;
    const mark = victim.getDynamicProperty(MARK_KEY) ?? 0;
    if (!erosion && !mark) return;

    const multiplier = Math.min(1.6, 1 + erosion * 0.04 + mark * 0.06);
    event.damage = event.damage * multiplier;
});

world.afterEvents.entityDie.subscribe((event) => {
    const boss = event.deadEntity;
    if (boss?.typeId !== BOSS_TYPE) return;

    states.delete(boss.id);

    const pupils = boss.dimension.getEntities({ location: boss.location, maxDistance: 32, type: PUPIL_TYPE });
    for (const pupil of pupils) {
        pupil.remove();
    }

    for (const player of boss.dimension.getPlayers({ location: boss.location, maxDistance: 64 })) {
        player.setDynamicProperty(EROSION_KEY, 0);
        player.setDynamicProperty(MARK_KEY, 0);
        playerTimers.delete(player.id);
    }

    particle(boss.dimension, boss.location);
});
