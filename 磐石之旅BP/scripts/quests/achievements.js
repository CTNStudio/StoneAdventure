import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { world, Player, system} from "@minecraft/server";
import { giveQuestAward, showMainMenu, isQuestCompleted, markQuestCompleted, checkQuestConditionWithQuest, buildQuestBody, checkAutoAchievement, isRewardClaimed, setRewardClaimed, notifyAchievementComplete} from "./quests_core.js";
import { CHAPTERS } from "./quests.js";

const useItemToQuests = new Map();
const USE_ITEM_PREFIX = "use_item_progress_"; // 用于分物品计数
const useTagToQuests = new Map();
const itemConditionQuests = new Map();

function initItemConditionMap() {
    itemConditionQuests.clear();
    const achievementsChapter = CHAPTERS.find(ch => ch.id === "sc_achievements");
    if (!achievementsChapter) return;
    for (const quest of achievementsChapter.quests) {
        const cond = quest.condition;
        let itemIds = [];
        if (cond.item) {
            itemIds.push(cond.item.itemId);
        } else if (cond.anyItem) {
            itemIds = cond.anyItem.map(it => it.itemId);
        } else if (cond.allItems) {
            itemIds = cond.allItems.map(it => it.itemId);
        }
        for (const id of itemIds) {
            if (!itemConditionQuests.has(id)) {
                itemConditionQuests.set(id, []);
            }
            itemConditionQuests.get(id).push(quest);
        }
    }
}
initItemConditionMap();

function initUseTagQuestMap() {
    useTagToQuests.clear();
    for (const chapter of CHAPTERS) {
        for (const quest of chapter.quests) {
            if (quest.condition.useTag) {
                const tag = quest.condition.useTag.tag;
                if (!useTagToQuests.has(tag)) {
                    useTagToQuests.set(tag, []);
                }
                useTagToQuests.get(tag).push(quest);
            }
        }
    }
}
initUseTagQuestMap();

export function addUseItemCount(player, questId, itemId, increment = 1) {
    const key = `stonecraft:${USE_ITEM_PREFIX}${questId}_${itemId}`;
    const current = player.getDynamicProperty(key) ?? 0;
    player.setDynamicProperty(key, current + increment);
}

export function getUseItemCount(player, questId, itemId) {
    const key = `stonecraft:${USE_ITEM_PREFIX}${questId}_${itemId}`;
    return player.getDynamicProperty(key) ?? 0;
}

export function resetUseItemCounts(player, questId, items) {
    for (const item of items) {
        const key = `stonecraft:${USE_ITEM_PREFIX}${questId}_${item.itemId}`;
        player.setDynamicProperty(key, 0);
    }
}
const useEachItemToQuests = new Map();

function initUseEachItemQuestMap() {
    useEachItemToQuests.clear();
    for (const chapter of CHAPTERS) {
        for (const quest of chapter.quests) {
            if (quest.condition.useEachItem) {
                const items = quest.condition.useEachItem.items;
                for (const item of items) {
                    const itemId = item.itemId;
                    if (!useEachItemToQuests.has(itemId)) {
                        useEachItemToQuests.set(itemId, []);
                    }
                    useEachItemToQuests.get(itemId).push(quest);
                }
            }
        }
    }
}
initUseEachItemQuestMap();

function initUseQuestMap() {
    useItemToQuests.clear();
    for (const chapter of CHAPTERS) {
        for (const quest of chapter.quests) {
            if (quest.condition.useItem) {
                const itemId = quest.condition.useItem.itemId;
                if (!useItemToQuests.has(itemId)) {
                    useItemToQuests.set(itemId, []);
                }
                useItemToQuests.get(itemId).push(quest);
            }
        }
    }
}
initUseQuestMap();

export function showAchievements(player) {
    const achievementsChapter = CHAPTERS.find(ch => ch.id === "sc_achievements");
    if (!achievementsChapter) {
        player.sendMessage({ translate: "achievements.chapter_not_found" });
        showMainMenu(player);
        return;
    }
    for (const quest of achievementsChapter.quests) {
        checkAutoAchievement(player, quest);
    }
    const form = new ActionFormData()
        .title(achievementsChapter.title || { translate: "sc.menu.achievements" })
        .body(achievementsChapter.description || { translate: "sc.menu.achievements.body" });

    for (const quest of achievementsChapter.quests) {
        let buttonText = quest.title;
        if (isQuestCompleted(player, quest)) {
            buttonText = { rawtext: [quest.title, { text: " \xA72\u2714" }] };
        }
        form.button(buttonText, quest.iconPath);
    }

    form.button({ translate: "gui.back" });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = achievementsChapter.quests.length;
        if (response.selection === total) {
            showMainMenu(player);
            return;
        }
        const selectedQuest = achievementsChapter.quests[response.selection];
        showAchievementDetail(player, selectedQuest);
    });
}

function showAchievementDetail(player, quest) {
    const isCompleted = isQuestCompleted(player, quest);
    const isClaimed = isRewardClaimed(player, quest.id);
    const body = buildQuestBody(quest, player);

    const form = new MessageFormData()
        .title(quest.title)
        .body(body)
        .button1({ translate: "gui.back" });

    if (!isCompleted) {
        form.button2({ translate: "quest.check" });
    } else if (isCompleted && !isClaimed) {
        form.button2({ translate: "quest.claim_reward" });
    } else {
        form.button2({ translate: "quest.reward_claimed" });
    }

    form.show(player).then((response) => {
        if (response.canceled || response.selection === undefined) {
            showAchievements(player);
            return;
        }
        if (response.selection === 0) {
            showAchievements(player);
        } else if (response.selection === 1) {
            if (!isCompleted) {
                tryCompleteAchievement(player, quest);
            } else if (isCompleted && !isClaimed) {
                giveQuestAward(player, quest);      // 内部会标记已领取
                player.playSound("random.orb");     // 领取奖励音效
                player.sendMessage({ translate: "quest.reward_claimed_success" });
                showAchievementDetail(player, quest);
            } else {
                player.sendMessage({ translate: "quest.reward_already_claimed" });
                showAchievements(player);
            }
        }
    });
}

function tryCompleteAchievement(player, quest) {
    if (isQuestCompleted(player, quest)) {
        player.sendMessage({ translate: "quest.already_completed" });
        showAchievements(player);
        return;
    }
    const result = checkQuestConditionWithQuest(player, quest);
    if (!result.success) {
        player.sendMessage({ rawtext: result.messages });
        showAchievementDetail(player, quest);
        return;
    }
    markQuestCompleted(player, quest);
    notifyAchievementComplete(player, quest);
    showAchievementDetail(player, quest);
}

const USE_PREFIX = "use_progress_";

export function addUseCount(player, questId, increment = 1) {
    const key = `stonecraft:${USE_PREFIX}${questId}`;
    const current = player.getDynamicProperty(key) ?? 0;
    player.setDynamicProperty(key, current + increment);
}

export function getUseCount(player, questId) {
    const key = `stonecraft:${USE_PREFIX}${questId}`;
    return player.getDynamicProperty(key) ?? 0;
}

export function resetUseCount(player, questId) {
    const key = `stonecraft:${USE_PREFIX}${questId}`;
    player.setDynamicProperty(key, 0);
}
world.afterEvents.itemCompleteUse.subscribe((event) => {
    const { source, itemStack } = event;
    if (!(source instanceof Player)) return;

    const itemId = itemStack.typeId;
    const itemTags = itemStack.getTags?.() ?? [];

    // 原有 useItem 处理
    const itemQuests = useItemToQuests.get(itemId);
    if (itemQuests) {
        for (const quest of itemQuests) {
            if (isQuestCompleted(source, quest)) continue;
            addUseCount(source, quest.id, 1);
            checkAutoAchievement(source, quest);
        }
    }

    for (const [tag, quests] of useTagToQuests) {
        if (!itemTags.includes(tag)) continue;
        for (const quest of quests) {
            if (isQuestCompleted(source, quest)) continue;
            addUseCount(source, quest.id, 1);
            checkAutoAchievement(source, quest);
        }
    }

    // 新增 useEachItem 处理
    const eachQuests = useEachItemToQuests.get(itemId);
    if (eachQuests) {
        for (const quest of eachQuests) {
            if (isQuestCompleted(source, quest)) continue;
            // 增加该物品的使用计数
            addUseItemCount(source, quest.id, itemId, 1);
            // 检查是否所有物品都已达标
            checkAutoAchievementEach(source, quest);
        }
    }
});
world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const player = event.player;
    if (!player) return;

    // 延迟 2 个 tick，确保物品已完全更新到背包
    system.runTimeout(() => {
        // 遍历所有物品条件任务（来自 itemConditionQuests 映射）
        for (const [itemId, quests] of itemConditionQuests) {
            for (const quest of quests) {
                // 只检查自动完成的任务（避免非自动任务被意外触发）
                if (quest.autoComplete === true) {
                    checkAutoAchievement(player, quest);
                }
            }
        }
    }, 2);
});
function checkAutoAchievementEach(player, quest) {
    if (!player || !quest) return false;
    if (quest.autoComplete !== true) return false;
    if (isQuestCompleted(player, quest)) return false;

    const items = quest.condition.useEachItem.items;
    for (const item of items) {
        const count = getUseItemCount(player, quest.id, item.itemId);
        if (count < (item.amount || 1)) {
            return false;
        }
    }
    markQuestCompleted(player, quest);
    notifyAchievementComplete(player, quest);
    return true;
}
export function resetUseItemCount(player, questId, itemId) {
    const key = `stonecraft:${USE_ITEM_PREFIX}${questId}_${itemId}`;
    player.setDynamicProperty(key, 0);
}

