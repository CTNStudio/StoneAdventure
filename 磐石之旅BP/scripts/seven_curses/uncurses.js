//七兆解咒：把「某条诅咒怎么解除」写成声明式规则表。
//
//加一条解咒 = 往 UNCURSE_RULES 加一个对象（不用改任何派发代码）。
//加一种新的触发方式（不是击杀，而是使用物品 / 踩到某处 / 到达某地……）= 在文件底部
//加一段对应的订阅，从 rulesFor("<新 trigger>") 取规则；规则表结构不用动。
//
//解除的保证：removeCurse 只去掉 tag，而每条诅咒的效果都是每 tick 重读 tag + hasCurse
//判定的，所以 tag 一没就不会再被施加；已经贴在身上的即时效果由各模块的 onRemoved 清掉。
import { world } from "@minecraft/server";
import { hasCurse, hasSeal, removeCurse } from "./index.js";
import { CURSE } from "./curse.js";
import { resolveKiller } from "../forge/damage_credit.js";
import { displayMessage, messageChannels } from "../messageManager.js";

const DONE_SOUND = "random.levelup";

const UNCURSE_RULES = [
  {
    //低光失明（解咒顺序第五条）；用常量而不是字面量，重排编号时不会错位
    curseId: CURSE.darkness,
    trigger: "entityDie",
    entityTypes: ["minecraft:warden"],
    titleKey: "stonecraft.septem.unc_5_title",
    bodyKey: "stonecraft.septem.unc_5_body",
    doneKey: "stonecraft.septem.unc_5_done",
  },
];

function rulesFor(trigger) {
  return UNCURSE_RULES.filter((rule) => rule.trigger === trigger);
}

//每次实体死亡都会走 entityDie，所以先把规则筛好，别在回调里重复分配
const ENTITY_DIE_RULES = rulesFor("entityDie");

function findRuleByEntity(rules, entityType) {
  for (const rule of rules) {
    if (rule.entityTypes.includes(entityType)) return rule;
  }
  return undefined;
}

function tryUncurse(player, rule) {
  try {
    if (!player?.isValid) return;
  } catch {
    return;
  }

  //没有背负封印的人做同样的事不该有任何反应
  if (!hasSeal(player)) return;

  //已经解过：给一句确认，不重复播报
  if (!hasCurse(player, rule.curseId)) {
    /*try {
      displayMessage(player, { translate: rule.doneKey }, { channel: messageChannels.actionbar });
    } catch {
    }*/
    return;
  }

  if (!removeCurse(player, rule.curseId)) return;

  try {
    player.onScreenDisplay.setTitle({ translate: rule.titleKey });
  } catch {
  }
  try {
    player.playSound(DONE_SOUND, { volume: 1, pitch: 1 });
  } catch {
  }
  try {
    displayMessage(player, { translate: rule.bodyKey }, { channel: messageChannels.chat });
  } catch {
  }
}

//触发方式：击杀指定实体
world.afterEvents.entityDie.subscribe((event) => {
  if (!ENTITY_DIE_RULES.length) return;

  const dead = event.deadEntity;
  if (!dead) return;

  let entityType;
  try {
    entityType = dead.typeId;
  } catch {
    return;
  }

  const rule = findRuleByEntity(ENTITY_DIE_RULES, entityType);
  if (!rule) return;

  const killer = resolveKiller(dead, event.damageSource);
  if (!killer?.isValid) return;

  tryUncurse(killer, rule);
});
