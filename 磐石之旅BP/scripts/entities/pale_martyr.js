import { world, system, MolangVariableMap, GameMode } from "@minecraft/server";
import { Boss, BossSkill, BossServer } from "../lib/StarTenonAPI/api.js";

const bossServer = new BossServer();
//幽匿感测体技能：轮询周期 20 刻
const sculkSensorSkill = new BossSkill(
  "stonecraft:sculk_sensor",// 技能 id
  20,// 轮询周期（刻）
  (executor) => {
    const vibration = takeVibration(executor);
    if (vibration) reactToVibration(executor, vibration);
  },
  14// 奇怪，库未使用该值，实际范围由 reportVibration 判定
);

const boss = new Boss(
  "stonecraft:pale_martyr",// 实体 typeId
  [sculkSensorSkill]
);

bossServer.addBoss(boss);

const PHASE2_EVENT = "stonecraft:pale_martyr_enter_phase_2";
const PHASE2_TAG = "stonecraft:pale_martyr_phase_2";
const STARTED_TAG = "stonecraft:pale_martyr_started";
const MAX_HP = 360;
const MIN_HP = 10;
const MERGE_TICKS = 50;
const MERGE_STEP = 2;
const MERGE_PARTICLES = [
  "minecraft:sculk_soul",
  "minecraft:portal_directional",
  "minecraft:sculk_charge_particle",
  "sculk_charge_pop_particle"
];

const VIBRATION_RADIUS = 14;// 感知半径
const VIBRATION_TTL = 40;// 振动有效期（刻），需大于技能轮询周期
const vibrations = new Map();// entityId -> { location, tick }

//把一次振动通报给半径内的本体与碎片
function reportVibration(dimension, location) {
  if (!dimension || !location) return;
  const now = system.currentTick;
  for (const type of ["stonecraft:pale_martyr", "stonecraft:pale_martyr_shard"]) {
    let nearby;
    try {
      nearby = dimension.getEntities({ location, maxDistance: VIBRATION_RADIUS, type });
    } catch {
      continue;
    }
    for (const entity of nearby) {
      try {
        if (!entity.isValid) continue;
        vibrations.set(entity.id, { location, tick: now });
      } catch {
      }
    }
  }
}

//技能轮询时取走该实体最近一次振动（同时清掉，避免重复触发）
function takeVibration(entity) {
  const record = vibrations.get(entity.id);
  if (!record) return undefined;
  vibrations.delete(entity.id);
  if (system.currentTick - record.tick > VIBRATION_TTL) return undefined;
  return record;
}

function reactToVibration(entity, vibration) {
  const { location } = vibration;
  const dimension = entity.dimension;

  //幽匿感测体的点击音效与粒子
  try {
    dimension.playSound("block.sculk_sensor.clicking", location, { volume: 1, pitch: 1 });
  } catch {
  }
  //sculk_charge_pop 是方向性粒子，必须注入 variable.direction，否则 Molang 报错
  let from;
  try {
    if (!entity.isValid) return;
    from = entity.location;
  } catch {
    return;
  }
  spawnMergeParticle(dimension, "minecraft:sculk_charge_pop_particle", location, {
    x: from.x - location.x,
    y: from.y - location.y + 0.5,
    z: from.z - location.z,
  });

  //朝声源靠近，保留 3 格间距避免贴脸
  try {
    const dx = from.x - location.x;
    const dy = from.y - location.y;
    const dz = from.z - location.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 1) return;
    const offset = 3;
    entity.tryTeleport({
      x: location.x + (dx / length) * offset,
      y: location.y + (dy / length) * offset,
      z: location.z + (dz / length) * offset,
    });
  } catch {
  }
}

function isCreative(player) {
  try {
    return player.getGameMode() === GameMode.Creative;
  } catch {
    return false;
  }
}

//创造模式玩家不产生振动（同原版）
world.afterEvents.playerBreakBlock.subscribe(({ player, block }) => {
  if (!player || isCreative(player)) return;
  reportVibration(block.dimension, block.location);
});

world.afterEvents.playerPlaceBlock.subscribe(({ player, block }) => {
  if (!player || isCreative(player)) return;
  reportVibration(block.dimension, block.location);
});

world.afterEvents.playerSwingStart.subscribe(({ player }) => {
  if (!player || isCreative(player)) return;
  reportVibration(player.dimension, player.location);
});

world.afterEvents.playerButtonInput.subscribe(({ player }) => {
  if (!player || isCreative(player)) return;
  reportVibration(player.dimension, player.location);
});

world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
  if (!player || isCreative(player)) return;
  reportVibration(block.dimension, block.location);
});

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  try {
    if (!hurtEntity?.isValid) return;
    const source = damageSource?.damagingEntity;
    const location = source?.isValid ? source.location : hurtEntity.location;
    if (!location) return;
    reportVibration(hurtEntity.dimension, location);
  } catch {
  }
});

const events = new Set();
let lastShardLocation;

function healthOf(entity) {
  try {
    const component = entity.getComponent("minecraft:health");
    return component ? component.currentValue : undefined;
  } catch {
    return undefined;
  }
}

function setEntityHp(event, value) {
  const component = event.getComponent("minecraft:health");
  if (!component) return;
  const next = Math.min(MAX_HP, Math.max(MIN_HP, value));
  if (next !== component.currentValue) component.setCurrentValue(next);
}

function spawnMergeParticle(dimension, particle, location, direction) {
  try {
    const molang = new MolangVariableMap();
    molang.setVector3("variable.direction", direction);
    molang.setFloat("variable.rotation", Math.random() * 360);
    dimension.spawnParticle(particle, location, molang);
  } catch {
  }
}

function playMergeEffect(event) {
  let elapsed = 0;
  const runId = system.runInterval(() => {
    if (!event.isValid || elapsed >= MERGE_TICKS) {
      system.clearRun(runId);
      return;
    }
    const center = event.location;
    const progress = elapsed / MERGE_TICKS;
    const radius = 3.2 * (1 - progress) + 0.3;
    for (const particle of MERGE_PARTICLES) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spread = radius * (0.4 + Math.random() * 0.6);
        spawnMergeParticle(
          event.dimension,
          particle,
          {
            x: center.x + Math.cos(angle) * spread,
            y: center.y + Math.random() * 2.4,
            z: center.z + Math.sin(angle) * spread,
          },
          { x: -Math.cos(angle), y: 0.4, z: -Math.sin(angle) }
        );
      }
    }
    elapsed += MERGE_STEP;
  }, MERGE_STEP);
}

function enterPhase2(event) {
  if (event.hasTag(PHASE2_TAG)) return;
  const current = healthOf(event);
  if (current === undefined || current <= 0) return;
  if (lastShardLocation) {
    event.tryTeleport(lastShardLocation);
    lastShardLocation = undefined;
  }
  event.addTag(PHASE2_TAG);
  event.triggerEvent(PHASE2_EVENT);
  const component = event.getComponent("minecraft:health");
  if (component) component.resetToMaxValue();
  playMergeEffect(event);
}

const PROP_PINCER_CD = "pm:pincer_cd";

const pincerRunning = new Set();

function pincerTarget(boss) {
  let players;
  try {
    players = boss.dimension.getPlayers({
      location: boss.location,
      maxDistance: 48,
    });
  } catch {
    return undefined;
  }
  let best;
  let bestDist = Infinity;
  for (const player of players) {
    let mode;
    try {
      mode = player.getGameMode();
    } catch {
      continue;
    }
    if (mode === GameMode.Creative || mode === GameMode.Spectator) continue;
    const dx = player.location.x - boss.location.x;
    const dy = player.location.y - boss.location.y;
    const dz = player.location.z - boss.location.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      best = player;
    }
  }
  return best;
}

function castPincer(boss) {
  if (pincerRunning.has(boss.id)) return false;

  const target = pincerTarget(boss);
  if (!target) return false;

  let shards;
  try {
    shards = boss.dimension.getEntities({
      type: "stonecraft:pale_martyr_shard",
      location: boss.location,
      maxDistance: 64,
    });
  } catch {
    return false;
  }
  if (shards.length === 0) return false;

  pincerRunning.add(boss.id);
  const dimension = boss.dimension;
  const count = shards.length;

  let center = { ...target.location };
  let locked;
  let points = [];

  const ring = (origin) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      list.push({
        x: origin.x + Math.cos(angle) * 4,
        y: origin.y,
        z: origin.z + Math.sin(angle) * 4,
      });
    }
    return list;
  };

  const place = (list) => {
    for (let i = 0; i < count; i++) {
      try {
        if (shards[i].isValid) shards[i].teleport(list[i]);
      } catch {
      }
    }
  };

  const follow = system.runInterval(() => {
    if (!boss.isValid) {
      system.clearRun(follow);
      pincerRunning.delete(boss.id);
      return;
    }
    if (!locked) {
      try {
        if (target.isValid) center = { ...target.location };
      } catch {
      }
      points = ring(center);
    }
    place(points);
  }, 2);

  points = ring(center);
  place(points);

  try {
    dimension.playSound("block.sculk_sensor.clicking", center, { volume: 1, pitch: 0.6 });
  } catch {
  }

  system.runTimeout(() => {
    if (!boss.isValid) {
      system.clearRun(follow);
      pincerRunning.delete(boss.id);
      return;
    }
    locked = { ...center };
    points = ring(locked);
    place(points);
    for (const pos of points) {
      spawnMergeParticle(
        dimension,
        "minecraft:sculk_soul",
        { x: pos.x, y: pos.y + 0.6, z: pos.z },
        { x: 0, y: 1, z: 0 }
      );
    }
  }, 30);

  system.runTimeout(() => {
    system.clearRun(follow);
    pincerRunning.delete(boss.id);
    if (!boss.isValid || !locked) return;

    for (let i = 0; i < count; i++) {
      try {
        const shard = shards[i];
        if (!shard.isValid) continue;
        const pos = points[i];
        const dx = locked.x - pos.x;
        const dy = locked.y - pos.y;
        const dz = locked.z - pos.z;
        const len = Math.hypot(dx, dy, dz) || 1;
        shard.clearVelocity();
        shard.applyImpulse({
          x: (dx / len) * 1.5,
          y: (dy / len) * 1.5 + 0.2,
          z: (dz / len) * 1.5,
        });
      } catch {
      }
    }

    try {
      dimension.playSound("mob.warden.roar", locked, { volume: 1, pitch: 1.1 });
    } catch {
    }
  }, 45);

  return true;
}

function tickEntity(event) {
  if (!event.isValid) {
    events.delete(event);
    return;
  }
  const current = healthOf(event);
  if (current === undefined || current <= 0) return;
  if (event.hasTag(PHASE2_TAG)) return;

  let pincerCd = event.getDynamicProperty(PROP_PINCER_CD);
  if (typeof pincerCd !== "number") pincerCd = 600;
  pincerCd -= 5;
  if (pincerCd <= 0) {
    pincerCd = castPincer(event) ? 600 : 500;
  }
  event.setDynamicProperty(PROP_PINCER_CD, pincerCd);

  const shards = event.dimension.getEntities({ type: "stonecraft:pale_martyr_shard" });
  let remaining = 0;
  for (const shard of shards) {
    const hp = healthOf(shard);
    if (hp === undefined || hp <= 0) continue;
    remaining += hp;
    lastShardLocation = shard.location;
  }

  if (shards.length > 0 && !event.hasTag(STARTED_TAG)) event.addTag(STARTED_TAG);
  setEntityHp(event, MIN_HP + remaining);

  if (event.hasTag(STARTED_TAG) && shards.length === 0) enterPhase2(event);
}

const SONIC_BOOM_CHANCE = 0.3;// 碎片拥有声波攻击的概率
const SHARD_COUNT = 7;
const DISPERSE_POWER = 1.5;
const DISPERSE_LIFT = 0.15;
let spawnIndex = 0;

//一阶段碎片共用同一套感测逻辑
bossServer.addBoss(new Boss("stonecraft:pale_martyr_shard", [sculkSensorSkill]));

world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;
  if (entity.typeId === "stonecraft:pale_martyr") {
    events.add(entity);
    spawnIndex = 0;
    return;
  }
  if (entity.typeId !== "stonecraft:pale_martyr_shard") return;

  //声波攻击概率：命中则延后一 tick 触发专用事件（此时碎片已初始化完成）
  if (Math.random() < SONIC_BOOM_CHANCE) {
    system.runTimeout(() => {
      try {
        if (entity.isValid) entity.triggerEvent("stonecraft:shard_attach_sonic");
      } catch {
      }
    }, 1);
  }

  const angle = (spawnIndex++ % SHARD_COUNT) * ((Math.PI * 2) / SHARD_COUNT);
  const impulse = {
    x: Math.cos(angle) * DISPERSE_POWER,
    y: DISPERSE_LIFT,
    z: Math.sin(angle) * DISPERSE_POWER,
  };
  system.runTimeout(() => {
    try {
      entity.clearVelocity();
      entity.applyImpulse(impulse);
    } catch {
    }
  }, 1);
});

world.afterEvents.worldLoad.subscribe(() => {
  for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
    for (const event of world.getDimension(dimensionId).getEntities({ type: "stonecraft:pale_martyr" })) {
      events.add(event);
    }
  }
});

system.runInterval(() => {
  for (const event of events) tickEntity(event);
}, 5);

function canHearHeartbeat(player) {
  try {
    const mode = player.getGameMode();
    return mode !== GameMode.Creative && mode !== GameMode.Spectator;
  } catch {
    return false;
  }
}

system.runInterval(() => {
  if (events.size === 0) return;
  for (const boss of [...events]) {
    if (!boss?.isValid) continue;
    let players;
    try {
      players = boss.dimension.getPlayers({
        location: boss.location,
        maxDistance: 16,
      });
    } catch {
      continue;
    }
    for (const player of players) {
      if (!canHearHeartbeat(player)) continue;
      player.playSound("mob.warden.heartbeat", {
        volume: 10.0,
        pitch: 0.9,
      });
    }
  }
}, 20);
