import {
  EntityComponentTypes,
  EquipmentSlot,
  MolangVariableMap,
  system,
  world
} from "@minecraft/server";

import { displayMessage } from "../../messageManager.js";
import { getOrZero } from "../forge_utils.js";
import { fireSonicBoom } from "./sonic_boom.js";

//等级 1/2/3 的蓄能阈值
const THRESHOLD = {
  sonic: [100, 75, 50],
  veil: [200, 150, 100]
};

const xpBaseline = new Map();
const sneakSince = new Map();
const lastUse = new Map();
const lastPrompt = new Map();
const pendingShots = new Map();
const autoChargeAt = new Map();

function equippableOf(player) {
  return player.getComponent(EntityComponentTypes.Equippable);
}

function levelOf(item, attr) {
  return item ? getOrZero(item, `stonecraft:${attr}_level`, 0) : 0;
}

function thresholdOf(attr, level) {
  return THRESHOLD[attr][level - 1];
}

function chargeOf(item, attr, level) {
  return Math.min(getOrZero(item, `stonecraft:xp_${attr}`, 0), thresholdOf(attr, level));
}

function canPrompt(player, attr, now) {
  const key = `${player.id}:${attr}`;
  if (now < (lastPrompt.get(key) ?? 0)) return false;
  lastPrompt.set(key, now + (attr === "sonic" ? 600 : 1200)); //剑 30 秒、胸甲 60 秒提示冷却
  return true;
}

function addCharge(player, target, attr, level, delta) {
  const threshold = thresholdOf(attr, level);
  const current = chargeOf(target, attr, level);
  if (current >= threshold) return false;

  const next = Math.min(current + delta, threshold);
  target.setDynamicProperty(`stonecraft:xp_${attr}`, next);
  if (next >= threshold) {
    displayMessage(player, { translate: `stonecraft.${attr}.ready` });
    player.playSound("random.orb");
  }
  return true;
}

function tickCharges(player, now) {
  const equippable = equippableOf(player);
  const sword = equippable.getEquipment(EquipmentSlot.Mainhand);
  const chest = equippable.getEquipment(EquipmentSlot.Chest);

  let amount = 0;

  const total = player.getTotalXp();
  const baseline = xpBaseline.get(player.id);
  if (baseline === undefined) {
    xpBaseline.set(player.id, total);
  } else {
    xpBaseline.set(player.id, total);
    amount += Math.max(0, total - baseline);
  }

  const last = autoChargeAt.get(player.id);
  if (last === undefined) {
    autoChargeAt.set(player.id, now);
  } else if (now - last >= 20) {
    const seconds = Math.floor((now - last) / 20);
    autoChargeAt.set(player.id, last + seconds * 20); //每秒自动 +1
    amount += seconds;
  }

  if (amount <= 0) return;

  const swordLevel = levelOf(sword, "sonic");
  if (swordLevel > 0 && addCharge(player, sword, "sonic", swordLevel, amount)) {
    equippable.setEquipment(EquipmentSlot.Mainhand, sword);
  }
  const veilLevel = levelOf(chest, "veil");
  if (veilLevel > 0) addCharge(player, player, "veil", veilLevel, amount); //蓄能记在玩家身上，不写护甲槽
}

function tickVeil(player, now) {
  const equippable = equippableOf(player);
  const chest = equippable.getEquipment(EquipmentSlot.Chest);
  const level = levelOf(chest, "veil");

  if (level <= 0 || !player.isSneaking) {
    sneakSince.delete(player.id);
    return;
  }

  const since = sneakSince.get(player.id) ?? now;
  sneakSince.set(player.id, since);
  if (now - since < 60) return; //连续潜行 3 秒

  sneakSince.set(player.id, now);

  if (chargeOf(player, "veil", level) < thresholdOf("veil", level)) {
    if (canPrompt(player, "veil", now)) {
      displayMessage(player, { translate: "stonecraft.veil.not_ready" });
    }
    return;
  }

  const key = `${player.id}:veil`;
  if (now - (lastUse.get(key) ?? -100) < 20) return; //技能 1 秒冷却
  lastUse.set(key, now);

  player.setDynamicProperty("stonecraft:xp_veil", 0);

  const darkness = [200, 400, 600][level - 1]; //10/20/30 秒
  const slowness = [60, 100, 200][level - 1]; //3/5/10 秒
  player.dimension.playSound("mob.warden.roar", player.location);

  const origin = player.location;
  const molang = new MolangVariableMap();
  molang.setVector3("variable.direction", { x: 0, y: 1, z: 0 });
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    player.dimension.spawnParticle("minecraft:sculk_soul_particle", {
      x: origin.x + Math.cos(angle) * 3,
      y: origin.y + 0.5,
      z: origin.z + Math.sin(angle) * 3
    }, molang);
  }

  for (const target of player.dimension.getEntities({ location: player.location, maxDistance: 3 })) {
    if (target.typeId === "minecraft:player") continue;
    if (!target.getComponent("minecraft:health")) continue;
    if (target.getComponent("minecraft:is_tamed")) continue;
    if (Math.abs(target.location.y - player.location.y) > 3) continue; //垂直范围，和半径一致

    target.addEffect("darkness", darkness, { amplifier: 0, showParticles: false });
    target.addEffect("slowness", slowness, { amplifier: 9, showParticles: false });
  }
}

function onItemUse(event) {
  const player = event.source;
  if (player?.typeId !== "minecraft:player") return;

  const equippable = equippableOf(player);
  const item = event.itemStack ?? equippable.getEquipment(EquipmentSlot.Mainhand);
  const level = levelOf(item, "sonic");
  if (level <= 0) return;

  const now = system.currentTick;
  if (chargeOf(item, "sonic", level) < thresholdOf("sonic", level)) {
    if (canPrompt(player, "sonic", now)) {
      displayMessage(player, { translate: "stonecraft.sonic.not_ready" });
    }
    return;
  }

  const key = `${player.id}:sonic`;
  if (now - (lastUse.get(key) ?? -100) < 20) return; //技能 1 秒冷却
  if (pendingShots.has(player.id)) return; //蓄力中

  pendingShots.set(player.id, now + 30); //右键 1.5 秒后发射
}

function tickSonicShots(player, now) {
  const due = pendingShots.get(player.id);
  if (due === undefined || now < due) return;

  pendingShots.delete(player.id);

  const equippable = equippableOf(player);
  const item = equippable.getEquipment(EquipmentSlot.Mainhand);
  const level = levelOf(item, "sonic");
  if (level <= 0) return;
  if (chargeOf(item, "sonic", level) < thresholdOf("sonic", level)) return;

  const key = `${player.id}:sonic`;
  if (now - (lastUse.get(key) ?? -100) < 20) return;
  lastUse.set(key, now);

  item.setDynamicProperty("stonecraft:xp_sonic", 0);
  equippable.setEquipment(EquipmentSlot.Mainhand, item);

  fireSonicBoom(player, [8, 12, 20][level - 1]);
}

let initialized = false;

export function initChargeAbilities() {
  if (initialized) return;
  initialized = true;

  world.afterEvents.itemUse.subscribe(onItemUse);

  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    xpBaseline.delete(playerId);
    sneakSince.delete(playerId);
    pendingShots.delete(playerId);
    autoChargeAt.delete(playerId);
    for (const key of [...lastUse.keys()]) {
      if (key.startsWith(`${playerId}:`)) lastUse.delete(key);
    }
    for (const key of [...lastPrompt.keys()]) {
      if (key.startsWith(`${playerId}:`)) lastPrompt.delete(key);
    }
  });

  system.runInterval(() => {
    const now = system.currentTick;
    for (const player of world.getAllPlayers()) {
      tickCharges(player, now);
      tickVeil(player, now);
      tickSonicShots(player, now);
    }
  }, 4);
}
