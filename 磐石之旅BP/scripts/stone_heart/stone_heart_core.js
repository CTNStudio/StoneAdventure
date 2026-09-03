import { world, system } from '@minecraft/server';
import { showStoneHeartFeedback } from './stone_heart_feedback.js';

const regenDelay = 100;
const regenSpeed = 0.5;
const stoneHeartInvulnerabilityTicks = 10;

const pendingDamage = new Map();
const lastDamageTick = new Map();
const lastRegenTick = new Map();
const stoneHeartInvulnerabilityUntil = new Map();

function getNumberProperty(player, id) {
  const value = player.getDynamicProperty(id);
  return typeof value === 'number' ? value : 0;
}

export function getStoneHeartMax(player) {
  return Math.max(0, getNumberProperty(player, 'stone_heartMax'));
}

export function getStoneHeart(player) {
  return Math.min(
    getStoneHeartMax(player),
    Math.max(0, getNumberProperty(player, 'stone_heart'))
  );
}

export function setStoneHeart(player, amount) {
  const stoneHeartMax = getStoneHeartMax(player);
  const stoneHeart = Math.min(stoneHeartMax, Math.max(0, amount));

  player.setDynamicProperty('stone_heart', stoneHeart);
  return stoneHeart;
}

export function setStoneHeartMax(player, amount) {
  const oldStoneHeartMax = getStoneHeartMax(player);
  const oldStoneHeart = getStoneHeart(player);
  const stoneHeartMax = Math.max(0, amount);

  const stoneHeart = stoneHeartMax > oldStoneHeartMax
    ? Math.min(stoneHeartMax, oldStoneHeart + stoneHeartMax - oldStoneHeartMax)
    : Math.min(oldStoneHeart, stoneHeartMax);

  player.setDynamicProperties({
    'stone_heartMax': stoneHeartMax,
    'stone_heart': stoneHeart
  });

  return stoneHeartMax;
}

export function increaseStoneHeartMax(player, amount) {
  if (typeof amount !== 'number' || amount === 0) {
    return getStoneHeartMax(player);
  }

  return setStoneHeartMax(player, getStoneHeartMax(player) + amount);
}

export function restoreStoneHeart(player, amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    return getStoneHeart(player);
  }

  return setStoneHeart(player, getStoneHeart(player) + amount);
}

export function damageStoneHeart(player, amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    return getStoneHeart(player);
  }

  return setStoneHeart(player, getStoneHeart(player) - amount);
}

function resetRegen(player) {
  lastDamageTick.set(player.id, system.currentTick);
  lastRegenTick.delete(player.id);
}

function queueStoneHeartDamage(player, amount) {
  if (amount <= 0) {
    return;
  }

  pendingDamage.set(
    player.id,
    (pendingDamage.get(player.id) ?? 0) + amount
  );
}

function commitStoneHeartDamage() {
  if (pendingDamage.size === 0) {
    return;
  }

  for (const [id, amount] of pendingDamage) {
    const player = world.getEntity(id);

    if (player?.typeId !== 'minecraft:player') {
      continue;
    }

    setStoneHeart(player, getStoneHeart(player) - amount);
  }

  pendingDamage.clear();
}

function regenStoneHeart() {
  const now = system.currentTick;

  for (const player of world.getAllPlayers()) {
    const stoneHeartMax = getStoneHeartMax(player);

    if (stoneHeartMax <= 0) {
      lastDamageTick.delete(player.id);
      lastRegenTick.delete(player.id);
      continue;
    }

    const stoneHeart = getStoneHeart(player);

    if (stoneHeart >= stoneHeartMax) {
      if (stoneHeart !== stoneHeartMax) {
        setStoneHeart(player, stoneHeartMax);
      }

      lastRegenTick.delete(player.id);
      continue;
    }

    const damageTick = lastDamageTick.get(player.id);

    if (damageTick === undefined) {
      lastDamageTick.set(player.id, now);
      continue;
    }

    if (now - damageTick < regenDelay) {
      lastRegenTick.delete(player.id);
      continue;
    }

    const startTick = Math.max(
      damageTick + regenDelay,
      lastRegenTick.get(player.id) ?? damageTick + regenDelay
    );

    const elapsedTicks = now - startTick;

    if (elapsedTicks <= 0 || regenSpeed <= 0) {
      continue;
    }

    const amount = elapsedTicks / 20 * regenSpeed;
    const actualAmount = Math.min(
      Math.floor(amount / 0.5) * 0.5,
      stoneHeartMax - stoneHeart
    );

    if (actualAmount <= 0) {
      continue;
    }

    setStoneHeart(player, stoneHeart + actualAmount);

    const usedTicks = actualAmount / regenSpeed * 20;
    lastRegenTick.set(player.id, startTick + usedTicks);

    if (getStoneHeart(player) >= stoneHeartMax) {
      setStoneHeart(player, stoneHeartMax);
      lastRegenTick.delete(player.id);
    }
  }
}

world.beforeEvents.entityHurt.subscribe(event => {
  const player = event.hurtEntity;

  if (player.typeId !== 'minecraft:player') {
    return;
  }

  const cause = event.damageSource.cause;

  if (cause === 'selfDestruct') {
    return;
  }

  const damage = event.damage;
  resetRegen(player);

  const stoneHeartMax = getStoneHeartMax(player);

  if (stoneHeartMax <= 0) {
    return;
  }

  const tick = system.currentTick;
  const invulnerabilityUntil =
    stoneHeartInvulnerabilityUntil.get(player.id) ?? -1;

  if (tick < invulnerabilityUntil) {
    event.damage = 0;
    return;
  }

  if (damage < 0.5) {
    showStoneHeartFeedback(player);
    return;
  }

  const queuedDamage = pendingDamage.get(player.id) ?? 0;
  const stoneHeart = Math.max(0, getStoneHeart(player) - queuedDamage);

  if (stoneHeart <= 0) {
    return;
  }

  const stoneHeartDamage = Math.min(damage, stoneHeart);
  const remainingDamage = damage - stoneHeartDamage;

  queueStoneHeartDamage(player, stoneHeartDamage);

  stoneHeartInvulnerabilityUntil.set(
    player.id,
    tick + stoneHeartInvulnerabilityTicks
  );

  showStoneHeartFeedback(player);

  event.damage = Math.max(0, remainingDamage);
});

system.run(commitStoneHeartDamage);
system.runInterval(commitStoneHeartDamage, 1);
system.runInterval(regenStoneHeart, 5);

world.afterEvents.playerSpawn.subscribe(event => {
  const player = event.player;
  const stoneHeartMax = getStoneHeartMax(player);

  lastDamageTick.set(player.id, system.currentTick);
  lastRegenTick.delete(player.id);
  stoneHeartInvulnerabilityUntil.delete(player.id);
  pendingDamage.delete(player.id);

  if (!event.initialSpawn && stoneHeartMax > 0) {
    setStoneHeart(player, stoneHeartMax);
  }
});