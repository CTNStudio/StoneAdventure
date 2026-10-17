import { world, system, MolangVariableMap } from "@minecraft/server";

const ENTITY_ID = "stonecraft:pale_martyr";
const SHARD_ID = "stonecraft:pale_martyr_shard";
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

  const shards = event.dimension.getEntities({ type: SHARD_ID });
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

const SHARD_COUNT = 7;
const DISPERSE_POWER = 1.5;
const DISPERSE_LIFT = 0.15;
let spawnIndex = 0;

world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;
  if (entity.typeId === ENTITY_ID) {
    events.add(entity);
    spawnIndex = 0;
    return;
  }
  if (entity.typeId !== SHARD_ID) return;
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
    for (const event of world.getDimension(dimensionId).getEntities({ type: ENTITY_ID })) {
      events.add(event);
    }
  }
});

system.runInterval(() => {
  for (const event of events) tickEntity(event);
}, INTERVAL_TICKS);
