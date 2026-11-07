import { system, world } from "@minecraft/server";
import { hasCurse, getCursedPlayers, registerEffectModule } from "./index.js";
import { displayMessage, messageChannels } from "../messageManager.js";

const CURSE = {
  stone: 1,
  fragile: 2,
  noTrade: 3,
  wear: 4,
  hostility: 5,
  darkness: 6,
  insomnia: 7,
};

const TRADE_BLOCKED = new Set(["minecraft:villager_v2", "minecraft:villager", "minecraft:wandering_trader"]);

//受限执行上下文（beforeEvents）里不能直接调原生方法，统一延到 system.run 再提示
function showBlockedHint(player, key) {
  system.run(() => {
    try {
      if (player?.isValid) {
        displayMessage(player, { translate: key }, { channel: messageChannels.actionbar });
      }
    } catch {
    }
  });
}

//诅咒 1：石化

const STONE_EFFECT_TICKS = 60;

function applyPetrification(player) {
  try {
    player.addEffect("slowness", STONE_EFFECT_TICKS, { amplifier: 0, showParticles: false });
    player.addEffect("hunger", STONE_EFFECT_TICKS, { amplifier: 0, showParticles: false });
    player.addEffect("mining_fatigue", STONE_EFFECT_TICKS, { amplifier: 0, showParticles: false });
    player.addEffect("weakness", STONE_EFFECT_TICKS, { amplifier: 1, showParticles: false });
  } catch {
  }
}

//诅咒 5：中立生物敌对

const HOSTILITY_RADIUS = 16;
const HOSTILITY_PULSE_TICKS = 100;
const HOSTILITY_POKE_DAMAGE = 0.1;
//同一只生物两次"戳"之间至少隔 30 秒，避免频繁闪红
const HOSTILITY_POKE_COOLDOWN = 600;
const lastPokeTick = new Map();

//能在数据层面主动打玩家的：直接触发愤怒事件
const NATIVE_ANGER = new Map([
  ["minecraft:bee", "attacked"],
  ["minecraft:hoglin", "become_angry_event"],
  ["minecraft:piglin_brute", "become_angry_event"],
]);

//其余中立生物触发愤怒后仍不会锁定玩家，只能借 hurt_by_target 反向激活
const PASSIVE_NEUTRALS = [
  "minecraft:wolf",
  "minecraft:enderman",
  "minecraft:zombie_pigman",
  "minecraft:panda",
  "minecraft:llama",
  "minecraft:trader_llama",
  "minecraft:dolphin",
  "minecraft:polar_bear",
  "minecraft:iron_golem",
];

function pokeNeutrals(player) {
  let entities;
  try {
    entities = player.dimension.getEntities({ location: player.location, maxDistance: HOSTILITY_RADIUS });
  } catch {
    return;
  }
  for (const entity of entities) {
    if (!entity?.isValid) continue;
    const angerEvent = NATIVE_ANGER.get(entity.typeId);
    if (angerEvent) {
      try {
        entity.triggerEvent(angerEvent);
      } catch {
      }
      continue;
    }
    if (!PASSIVE_NEUTRALS.includes(entity.typeId)) continue;
    //冷却内不重复戳，避免一直闪受击特效
    const last = lastPokeTick.get(entity.id) ?? -HOSTILITY_POKE_COOLDOWN;
    if (system.currentTick - last < HOSTILITY_POKE_COOLDOWN) continue;
    lastPokeTick.set(entity.id, system.currentTick);
    try {
      const health = entity.getComponent("minecraft:health");
      if (!health || health.currentValue <= 1) continue;
      const before = health.currentValue;
      entity.applyDamage(HOSTILITY_POKE_DAMAGE, {
        cause: "entityAttack",
        damagingEntity: player,
      });
      //把刚才那点伤害补回去，只借用受击触发的 hurt_by_target
      try {
        if (entity.isValid) health.setCurrentValue(Math.min(health.effectiveMax, before));
      } catch {
      }
    } catch {
    }
  }
}

//诅咒 4：耐久翻倍

const WEAR_INTERVAL_TICKS = 10;
const WEAR_SLOTS = ["Mainhand", "Offhand", "Head", "Chest", "Legs", "Feet"];
const wearBaseline = new Map(); // playerId -> Map(slot -> { typeId, damage })

function consumeExtraDurability(player) {
  let equippable;
  try {
    equippable = player.getComponent("minecraft:equippable");
  } catch {
    return;
  }
  if (!equippable) return;

  let cache = wearBaseline.get(player.id);
  if (!cache) {
    cache = new Map();
    wearBaseline.set(player.id, cache);
  }

  for (const slot of WEAR_SLOTS) {
    let item;
    try {
      item = equippable.getEquipment(slot);
    } catch {
      continue;
    }
    const durability = item?.getComponent("minecraft:durability");
    if (!durability) {
      cache.delete(slot);
      continue;
    }
    const prev = cache.get(slot);
    if (!prev || prev.typeId !== item.typeId) {
      cache.set(slot, { typeId: item.typeId, damage: durability.damage });
      continue;
    }
    const delta = durability.damage - prev.damage;
    if (delta > 0) {
      try {
        durability.damage = Math.min(durability.maxDurability - 1, durability.damage + delta);
        equippable.setEquipment(slot, item);
        cache.set(slot, { typeId: item.typeId, damage: durability.damage });
      } catch {
      }
      continue;
    }
    cache.set(slot, { typeId: item.typeId, damage: durability.damage });
  }
}

//诅咒 6：低光失明

const BLINDNESS_LIGHT_LIMIT = 4;
const BLINDNESS_TICKS = 40;

function applyDarknessBlindness(player) {
  try {
    const block = player.dimension.getBlock(player.location);
    if (!block) return;
    const level = block.getLightLevel?.() ?? 15;
    if (level >= BLINDNESS_LIGHT_LIMIT) return;
    player.addEffect("blindness", BLINDNESS_TICKS, { amplifier: 0, showParticles: false });
  } catch {
  }
}

//事件：诅咒 2 / 7、祝福 4

world.beforeEvents.entityHurt.subscribe((event) => {
  const hurt = event.hurtEntity;
  if (hurt?.typeId !== "minecraft:player") return;
  try {
    //诅咒 2：受到伤害增加
    if (hasCurse(hurt, CURSE.fragile)) {
      event.damage = (Number(event.damage) || 0) * 1.25;
    }
  } catch {
  }
});

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const player = event.player;
  if (!player?.isValid || !hasCurse(player, CURSE.noTrade)) return;
  const target = event.target;
  if (!target || !TRADE_BLOCKED.has(target.typeId)) return;
  try {
    event.cancel = true;
  } catch {
  }
  showBlockedHint(player, "stonecraft.septem.curse3_blocked");
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const player = event.player;
  if (!player?.isValid || !hasCurse(player, CURSE.insomnia)) return;
  const block = event.block;
  //基岩版所有床都是 minecraft:bed（颜色在方块状态里），不能用 _bed 后缀判断
  if (!block || !String(block.typeId).includes("bed")) return;
  try {
    event.cancel = true;
  } catch {
  }
  //beforeEvents 是受限执行上下文，setActionBar 这类原生方法必须延到 system.run
  showBlockedHint(player, "stonecraft.septem.curse7_blocked");
});

//主循环

system.runInterval(() => {
  for (const player of getCursedPlayers()) {
    if (!player?.isValid) continue;
    if (hasCurse(player, CURSE.wear)) {
      try {
        consumeExtraDurability(player);
      } catch {
      }
    }
  }
}, WEAR_INTERVAL_TICKS);

let pulseCounter = 0;

system.runInterval(() => {
  pulseCounter++;
  const pulseNeutrals = pulseCounter * 20 >= HOSTILITY_PULSE_TICKS;
  if (pulseNeutrals) {
    pulseCounter = 0;
    //避免 lastPokeTick 无限增长
    if (lastPokeTick.size > 200) lastPokeTick.clear();
  }

  for (const player of getCursedPlayers()) {
    if (!player?.isValid) continue;
    if (hasCurse(player, CURSE.darkness)) {
      try {
        applyDarknessBlindness(player);
      } catch {
      }
    }
    if (pulseNeutrals && hasCurse(player, CURSE.hostility)) {
      try {
        pokeNeutrals(player);
      } catch {
      }
    }
    //兜底：万一床交互没拦住，睡着就立刻叫醒，并给出同样的提示
    if (hasCurse(player, CURSE.insomnia)) {
      try {
        if (player.isSleeping) {
          const loc = player.location;
          player.teleport({ x: loc.x, y: loc.y + 0.01, z: loc.z });
          showBlockedHint(player, "stonecraft.septem.curse7_blocked");
        }
      } catch {
      }
    }
  }
}, 20);

export function tickPetrification(player) {
  if (hasCurse(player, CURSE.stone)) applyPetrification(player);
}

//接入 index.js 的 20 tick 主循环
registerEffectModule({
  tick(player) {
    tickPetrification(player);
  },
});

world.afterEvents.playerLeave.subscribe((event) => {
  for (const id of [...wearBaseline.keys()]) {
    if (id === event.playerId) wearBaseline.delete(id);
  }
});

export { CURSE };
