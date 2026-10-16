import { world, system, MolangVariableMap } from "@minecraft/server";

const ALPHA_ID = "stonecraft:pale_martyr";
const SHARD_ID = "stonecraft:pale_martyr_shard";
const PHASE2_EVENT = "stonecraft:pale_martyr_enter_phase_2";
const PHASE2_TAG = "stonecraft:pale_martyr_phase_2";
const STARTED_TAG = "stonecraft:pale_martyr_started";
const MAX_HP = 360;
const MIN_HP = 10;
const INTERVAL_TICKS = 5;
const MERGE_TICKS = 34;
const MERGE_STEP = 2;
const MERGE_PARTICLES = [
  "minecraft:sculk_soul",
  "minecraft:portal_directional",
  "minecraft:wither_boss_invulnerable",
];

const alphas = new Set();
let lastShardLocation;

function healthOf(entity) {
  try {
    const component = entity.getComponent("minecraft:health");
    return component ? component.currentValue : undefined;
  } catch {
    return undefined;
  }
}

function setAlphaHp(alpha, value) {
  const component = alpha.getComponent("minecraft:health");
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

function playMergeEffect(alpha) {
  let elapsed = 0;
  const runId = system.runInterval(() => {
    if (!alpha.isValid || elapsed >= MERGE_TICKS) {
      system.clearRun(runId);
      return;
    }
    const center = alpha.location;
    const progress = elapsed / MERGE_TICKS;
    const radius = 3.2 * (1 - progress) + 0.3;
    for (const particle of MERGE_PARTICLES) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spread = radius * (0.4 + Math.random() * 0.6);
        spawnMergeParticle(
          alpha.dimension,
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

function enterPhase2(alpha) {
  if (alpha.hasTag(PHASE2_TAG)) return;
  const current = healthOf(alpha);
  if (current === undefined || current <= 0) return;
  if (lastShardLocation) {
    alpha.tryTeleport(lastShardLocation);
    lastShardLocation = undefined;
  }
  alpha.addTag(PHASE2_TAG);
  alpha.triggerEvent(PHASE2_EVENT);
  const component = alpha.getComponent("minecraft:health");
  if (component) component.resetToMaxValue();
  playMergeEffect(alpha);
}

function tickAlpha(alpha) {
  if (!alpha.isValid) {
    alphas.delete(alpha);
    return;
  }
  const current = healthOf(alpha);
  if (current === undefined || current <= 0) return;
  if (alpha.hasTag(PHASE2_TAG)) return;

  const shards = alpha.dimension.getEntities({ type: SHARD_ID });
  let remaining = 0;
  for (const shard of shards) {
    const hp = healthOf(shard);
    if (hp === undefined || hp <= 0) continue;
    remaining += hp;
    lastShardLocation = shard.location;
  }

  if (shards.length > 0 && !alpha.hasTag(STARTED_TAG)) alpha.addTag(STARTED_TAG);
  setAlphaHp(alpha, MIN_HP + remaining);

  if (alpha.hasTag(STARTED_TAG) && shards.length === 0) enterPhase2(alpha);
}

world.afterEvents.entitySpawn.subscribe((event) => {
  if (event.entity.typeId === ALPHA_ID) alphas.add(event.entity);
});

world.afterEvents.worldLoad.subscribe(() => {
  for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
    for (const alpha of world.getDimension(dimensionId).getEntities({ type: ALPHA_ID })) {
      alphas.add(alpha);
    }
  }
});

system.runInterval(() => {
  for (const alpha of alphas) tickAlpha(alpha);
}, INTERVAL_TICKS);
