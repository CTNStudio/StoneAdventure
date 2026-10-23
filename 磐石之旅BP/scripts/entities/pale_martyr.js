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
const INTERVAL_TICKS = 5;
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

  //A：幽匿感测体的点击音效与粒子
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

  //B：朝声源靠近，保留 3 格间距避免贴脸
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

function tickEntity(event) {
  if (!event.isValid) {
    events.delete(event);
    return;
  }
  const current = healthOf(event);
  if (current === undefined || current <= 0) return;
  if (event.hasTag(PHASE2_TAG)) return;

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
}, INTERVAL_TICKS);
