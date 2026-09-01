import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { giveQuestAward, showMainMenu, isQuestCompleted, markQuestCompleted, checkQuestConditionWithQuest, buildQuestBody } from "./quests_core.js";
import { CHAPTERS } from "./quests.js";

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
    const body = buildQuestBody(quest);

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