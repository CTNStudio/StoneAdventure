import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { world, Player } from "@minecraft/server";
import { giveQuestAward, showMainMenu, isQuestCompleted, markQuestCompleted, checkQuestConditionWithQuest, buildQuestBody, checkAutoAchievement } from "./quests_core.js";
import { CHAPTERS } from "./quests.js";

const useItemToQuests = new Map();

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
    const body = buildQuestBody(quest, player);

    const form = new MessageFormData()
        .title(quest.title)
        .body(body)
        .button1({ translate: "gui.back" });

    if (isCompleted) {
        form.button2({ translate: "quest.done" });
    } else {
        form.button2({ translate: "quest.check" });
    }

    form.show(player).then((response) => {
        if (response.canceled || response.selection === undefined) {
            showAchievements(player);
            return;
        }
        if (response.selection === 0) {
            showAchievements(player);
        } else if (response.selection === 1) {
            if (isCompleted) {
                showAchievements(player);
            } else {
                tryCompleteAchievement(player, quest);
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
    giveQuestAward(player, quest);
    player.sendMessage({ translate: "achievement.unlocked" });
    showAchievements(player);
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
    const quests = useItemToQuests.get(itemId);
    if (!quests) return;

    for (const quest of quests) {
        if (isQuestCompleted(source, quest)) continue;
        addUseCount(source, quest.id, 1);
         checkAutoAchievement(source, quest);
    }
});