import { world, ItemStack, Player } from "@minecraft/server";
import { CHAPTERS } from "./quests.js";
import { getUseCount, getUseItemCount, resetUseCount, resetUseItemCounts } from "./achievements.js";
import { displayMessage } from "../messageManager.js";
import { checkWeeklyProgress, getWeeklyQuests, addWeeklyKillCount } from "./weekly_routine.js";
import { addStonePoint } from "../stone_point.js";

// 导入 UI 函数
import {
    showQuestBook,
    showMainMenu
} from "./quests_ui.js";
export {
    showQuestBook,
    showMainMenu
};

const NAMESPACE = "stonecraft";
const QUEST_BOOK_ID = `${NAMESPACE}:stone_encyclopedia`;
const kill_prefix = "kill_progress_";

export function isRewardClaimed(player, questId) {
    return player.getDynamicProperty(`${NAMESPACE}:reward_claimed_${questId}`) ?? false;
}

export function setRewardClaimed(player, questId, claimed = true) {
    player.setDynamicProperty(`${NAMESPACE}:reward_claimed_${questId}`, claimed);
}

export function addKillCount(player, questId, increment = 1) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    const current = player.getDynamicProperty(key) ?? 0;
    player.setDynamicProperty(key, current + increment);
}

export function getKillCount(player, questId) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    return player.getDynamicProperty(key) ?? 0;
}

export function resetKillCount(player, questId) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    player.setDynamicProperty(key, 0);
}

const entityToQuests = new Map();

const BOSS_ENTITIES = [
    "stonecraft:ancient_stone_totem",
    "stonecraft:spire_remnant"
];

function initKillQuestMap() {
    entityToQuests.clear();
    for (const chapter of CHAPTERS) {
        for (const quest of chapter.quests) {
            if (quest.condition.killEntity) {
                const entityType = quest.condition.killEntity.entityType;
                if (!entityToQuests.has(entityType)) {
                    entityToQuests.set(entityType, []);
                }
                entityToQuests.get(entityType).push(quest);
            }
        }
    }
}
initKillQuestMap();

function getPlayerContainer(player) {
    const inventory = player.getComponent("minecraft:inventory");
    return inventory?.container;
}

function hasEnoughItems(player, itemId, requiredAmount) {
    const container = getPlayerContainer(player);
    if (!container) return false;
    let count = 0;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item?.typeId === itemId) {
            count += item.amount;
            if (count >= requiredAmount) return true;
        }
    }
    return false;
}

function hasItemWithTag(player, tag) {
    const container = getPlayerContainer(player);
    if (!container) return false;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && typeof item.getTags === "function") {
            if (item.getTags().includes(tag)) return true;
        }
    }
    return false;
}

export function checkQuestConditionWithQuest(player, quest) {
    const condition = quest.condition;
    const messages = [];

    if (condition.item) {
        if (!hasEnoughItems(player, condition.item.itemId, condition.item.amount)) {
            messages.push({
                translate: "quest.not_enough.item",
                with: { rawtext: [{ text: condition.item.amount.toString() }, condition.item.name] }
            });
        }
    }

    if (condition.anyItem && Array.isArray(condition.anyItem)) {
        let hasAny = false;
        const itemNames = [];
        for (const item of condition.anyItem) {
            if (hasEnoughItems(player, item.itemId, item.amount)) {
                hasAny = true;
                break;
            }
            itemNames.push(item.name);
        }
        if (!hasAny) {
            const nameList = { rawtext: [] };
            for (let i = 0; i < itemNames.length; i++) {
                if (i > 0) nameList.rawtext.push({ text: ", " });
                nameList.rawtext.push(itemNames[i]);
            }
            messages.push({
                translate: "quest.not_enough.any_item",
                with: nameList
            });
        }
    }

    if (condition.allItems && Array.isArray(condition.allItems)) {
        for (const item of condition.allItems) {
            if (!hasEnoughItems(player, item.itemId, item.amount)) {
                messages.push({
                    translate: "quest.not_enough.item",
                    with: { rawtext: [{ text: item.amount.toString() }, item.name] }
                });
            }
        }
    }

    if (condition.anyTag && Array.isArray(condition.anyTag)) {
        let hasAny = false;
        const missingTags = [];
        for (const tagItem of condition.anyTag) {
            if (hasItemWithTag(player, tagItem.tag)) {
                hasAny = true;
                break;
            } else {
                missingTags.push(tagItem.name);
            }
        }
        if (!hasAny) {
            const nameList = { rawtext: [] };
            for (let i = 0; i < missingTags.length; i++) {
                if (i > 0) nameList.rawtext.push({ text: ", " });
                nameList.rawtext.push(missingTags[i]);
            }
            messages.push({
                translate: "quest.not_enough.any_tag_item",
                with: nameList
            });
        }
    }

    if (condition.killEntity) {
        const required = condition.killEntity.amount || 1;
        const current = getKillCount(player, quest.id);
        if (current < required) {
            messages.push({
                translate: "quest.not_enough.kill",
                with: { rawtext: [{ text: required.toString() }, condition.killEntity.name] }
            });
        }
    }
    if (condition.useItem) {
        const required = condition.useItem.amount || 1;
        const current = getUseCount(player, quest.id);
        if (current < required) {
            messages.push({
                translate: "quest.not_enough.use_item",
                with: { rawtext: [{ text: required.toString() }, condition.useItem.name] }
            });
        }
    }
    if (condition.useTag) {
        const required = condition.useTag.amount || 1;
        const current = getUseCount(player, quest.id); // 复用使用计数
        if (current < required) {
            messages.push({
                translate: "quest.not_enough.use_tag",
                with: { rawtext: [{ text: required.toString() }, condition.useTag.name] }
            });
        }
    }
    if (condition.useEachItem) {
        const items = condition.useEachItem.items;
        for (const item of items) {
            const required = item.amount || 1;
            const current = getUseItemCount(player, quest.id, item.itemId);
            if (current < required) {
                const itemName = item.name || { text: item.itemId };
                messages.push({
                    translate: "quest.not_enough.use_each_item",
                    with: { rawtext: [{ text: required.toString() }, itemName] }
                });
                break;
            }
        }
    }
    return { success: messages.length === 0, messages };
}

function takeItems(player, itemId, amount) {
    const container = getPlayerContainer(player);
    if (!container) return false;
    let remaining = amount;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item?.typeId === itemId) {
            if (item.amount > remaining) {
                item.amount -= remaining;
                container.setItem(i, item);
                return true;
            } else {
                remaining -= item.amount;
                container.setItem(i, undefined);
                if (remaining === 0) return true;
            }
        }
    }
    return false;
}

export function giveItem(player, itemStack) {
    const container = getPlayerContainer(player);
    if (!container) {
        player.dimension.spawnItem(itemStack, player.location);
        return;
    }
    const remainder = container.addItem(itemStack);
    if (remainder && remainder.amount > 0) {
        player.dimension.spawnItem(remainder, player.location);
    }
}

export function isQuestCompleted(player, quest) {
    return player.hasTag(`${NAMESPACE}:${quest.id}`);
}

export function markQuestCompleted(player, quest) {
    player.addTag(`${NAMESPACE}:${quest.id}`);
    if (quest.condition.useEachItem) {
        const items = quest.condition.useEachItem.items;
        resetUseItemCounts(player, quest.id, items);
    }
    if (quest.condition.useEachItem) {
        resetUseItemCounts(player, quest.id, quest.condition.useEachItem.items);
    }
    if (quest.manualReward) {
        setRewardClaimed(player, quest.id, false);
    }
    const killTag = `${NAMESPACE}:kill_${quest.id}`;
    if (player.hasTag(killTag)) player.removeTag(killTag);
    resetKillCount(player, quest.id);
    resetUseCount(player, quest.id);
}

export function giveQuestAward(player, quest) {
    const award = quest.award;
    if (award.exp) {
        player.addExperience(award.exp);
    }
    if (award.level) {
        player.addLevels(award.level);
    }
    if (award.items && Array.isArray(award.items)) {
        for (const item of award.items) {
            const itemStack = new ItemStack(item.itemId, item.amount);
            giveItem(player, itemStack);
        }
    }
    if (award.stonePoint && typeof award.stonePoint === 'number') {
        addStonePoint(player, award.stonePoint);
    }
    if (quest.manualReward) {
        setRewardClaimed(player, quest.id, true);
    } else {
        player.playSound("random.levelup");
        const prefix = { translate: "quest.finished" };
        let titleMessage;
        if (typeof quest.title === "string") {
            titleMessage = { text: quest.title };
        } else {
            titleMessage = quest.title;
        }
        const message = {
            rawtext: [
                prefix,
                { text: "「" },
                titleMessage,
                { text: "」" }
            ]
        };
        player.sendMessage(message);
    }
}

export function buildQuestBody(quest, player) {
    const condition = quest.condition;
    const award = quest.award;
    let body = {
        rawtext: [
            typeof quest.description === "string" ? { text: quest.description } : quest.description,
            { text: "\n\n" },
            { translate: "quest.condition.header" }
        ]
    };

    if (condition.item) {
        body.rawtext.push({
            translate: "quest.item",
            with: { rawtext: [{ text: condition.item.amount.toString() }, condition.item.name] }
        });
    } else if (condition.allItems && condition.allItems.length > 0) {
        body.rawtext.push({ translate: "quest.condition.all_items" });
        for (let i = 0; i < condition.allItems.length; i++) {
            const item = condition.allItems[i];
            if (i > 0) body.rawtext.push({ text: "\n" });
            body.rawtext.push({
                translate: "quest.item",
                with: { rawtext: [{ text: item.amount.toString() }, item.name] }
            });
        }
    } else if (condition.anyItem && condition.anyItem.length > 0) {
        body.rawtext.push({ translate: "quest.condition.any_item" });
        for (let i = 0; i < condition.anyItem.length; i++) {
            const item = condition.anyItem[i];
            if (i > 0) body.rawtext.push({ translate: "quest.or" });
            body.rawtext.push({
                translate: "quest.item",
                with: { rawtext: [{ text: item.amount.toString() }, item.name] }
            });
        }
    } else if (condition.anyTag && condition.anyTag.length > 0) {
        body.rawtext.push({ translate: "quest.condition.any_tag_item" });
        for (let i = 0; i < condition.anyTag.length; i++) {
            const tagItem = condition.anyTag[i];
            if (i > 0) body.rawtext.push({ translate: "quest.or" });
            body.rawtext.push({
                translate: "quest.item_with_tag",
                with: { rawtext: [tagItem.name] }
            });
        }
    } else if (condition.killEntity) {
        const required = condition.killEntity.amount || 1;
        const current = getKillCount(player, quest.id);
        body.rawtext.push({
            translate: "quest.kill",
            with: {
                rawtext: [
                    condition.killEntity.name,
                    { text: ` §7${current}/${required}` }
                ]
            }
        });
    } else if (condition.useItem) {
        const required = condition.useItem.amount || 1;
        body.rawtext.push({
            translate: "quest.use_item",
            with: { rawtext: [{ text: required.toString() }, condition.useItem.name] }
        });
        if (player) {
            const current = getUseCount(player, quest.id);
            body.rawtext.push({
                text: ` §7(${current}/${required})`
            });
        }
    } else if (condition.useTag) {
        const required = condition.useTag.amount || 1;
        body.rawtext.push({
            translate: "quest.use_tag",
            with: { rawtext: [{ text: required.toString() }, condition.useTag.name] }
        });
        if (player) {
            const current = getUseCount(player, quest.id);
            body.rawtext.push({ text: ` §7(${current}/${required})` });
        }
    } else if (condition.useEachItem) {
        const items = condition.useEachItem.items;
        body.rawtext.push({ translate: "quest.need_all_items" });
        for (const item of items) {
            const required = item.amount || 1;
            const current = player ? getUseItemCount(player, quest.id, item.itemId) : 0;
            const name = item.name || { text: item.itemId };
            const progress = player ? ` §7(${current}/${required})` : "";
            body.rawtext.push({ text: "  " });
            body.rawtext.push(name);
            body.rawtext.push({ text: ` ${required} 个${progress}\n` });
        }
    } else {
        body.rawtext.push({ translate: "quest.condition.none" });
    }

    body.rawtext.push({ text: "\n\n" }, { translate: "quest.award.header" });

    if (award.items && award.items.length > 0) {
        for (const item of award.items) {
            body.rawtext.push({
                translate: "quest.item",
                with: { rawtext: [{ text: item.amount.toString() }, item.name] }
            });
        }
    }
    if (award.exp) {
        body.rawtext.push({
            translate: "quest.xp",
            with: { rawtext: [{ text: award.exp.toString() }] }
        });
    }
    if (award.level) {
        body.rawtext.push({
            translate: "quest.level",
            with: { rawtext: [{ text: award.level.toString() }] }
        });
    }
    if (award.stonePoint && typeof award.stonePoint === 'number') {
        body.rawtext.push({
            translate: "quest.stone_point",
            with: { rawtext: [{ text: award.stonePoint.toString() }] }
        });
    }
    if ((!award.items || award.items.length === 0) && !award.exp && !award.level) {
        body.rawtext.push({ translate: "quest.award.none" });
    }

    return body;
}

//自动完成
export function checkAutoAchievement(player, quest) {
    if (!player || !quest) return false;
    if (quest.autoComplete !== true) return false;
    if (isQuestCompleted(player, quest)) return false;

    const result = checkQuestConditionWithQuest(player, quest);
    if (!result.success) return false;
    markQuestCompleted(player, quest);
    notifyAchievementComplete(player, quest);
    return true;
}

export function notifyAchievementComplete(player, quest) {
    if (!player || !quest) return;
    player.playSound("random.levelup");
    const prefix = { translate: "quest.completed_go_claim" };
    let titleMessage;
    if (typeof quest.title === "string") {
        titleMessage = { text: quest.title };
    } else {
        titleMessage = quest.title;
    }
    const message = {
        rawtext: [
            prefix,
            { text: "「" },
            titleMessage,
            { text: "」" }
        ]
    };
    displayMessage(player, message);
}

//事件监听
world.afterEvents.entityDie.subscribe((event) => {
    const { deadEntity, damageSource } = event;
    const player = damageSource.damagingEntity;
    if (!(player instanceof Player)) return;
    const entityType = deadEntity.typeId;
    const quests = entityToQuests.get(entityType);
    if (!quests) return;
    for (const quest of quests) {
        if (isQuestCompleted(player, quest)) continue;
        addKillCount(player, quest.id, 1);
        checkAutoAchievement(player, quest);
    }
    // 检查周常任务
    const weeklyQuests = getWeeklyQuests();
    for (const quest of weeklyQuests) {
        if (quest.condition.killEntity && quest.condition.killEntity.entityType === entityType) {
            addWeeklyKillCount(player, quest.id, 1);  // ← 新增
            checkWeeklyProgress(player, quest);
        }
    }
});

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (!event.initialSpawn) return;

    const hasReceived = player.getDynamicProperty(`${NAMESPACE}:received_book`);
    if (hasReceived) return;

    const bookItem = new ItemStack(QUEST_BOOK_ID, 1);
    giveItem(player, bookItem);
    player.setDynamicProperty(`${NAMESPACE}:received_book`, true);
});

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack.typeId === QUEST_BOOK_ID) {
        showQuestBook(event.source);
    }
});