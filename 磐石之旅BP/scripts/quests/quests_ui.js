import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { displayMessage } from "../messageManager.js";
import { showAchievements } from "./achievements.js";
import { showSettingsMenu } from "../settings.js";
import { getStoneHeart, getStoneHeartMax } from "../stone_heart/stone_heart_core.js";
import { ATTRIBUTE_DEFS, getOrZero } from "../forge/forge_utils.js";
import {
    isQuestCompleted,
    markQuestCompleted,
    giveQuestAward,
    buildQuestBody,
    checkQuestConditionWithQuest,
} from "./quests_core.js";
import { CHAPTERS } from "./quests.js";
import { showWeeklyMenu } from "./weekly_routine.js";

const BOSS_ENTITIES = [
    "stonecraft:ancient_stone_totem",
    "stonecraft:spire_remnant"
];

//制作名单
function showCredits(player) {
    const form = new ActionFormData()
        .title({ translate: "sc.credits.title" })
        .label({ translate: "sc.credits.body" })
        .divider()
        .label({ translate: "sc.credits.body2" })
        .button({ translate: "gui.back" });

    form.show(player).then((response) => {
        if (!response.canceled) {
            showMainMenu(player);
        }
    });
}

//主菜单
export function showQuestBook(player) {
    showMainMenu(player);
}

export function showMainMenu(player) {
    const form = new ActionFormData()
        .title({ translate: "stonecraft.item.stone_encyclopedia" })
        .body({ translate: "stonecraft.item.stone_encyclopedia.body" });
    form.button({ translate: "sc.menu.tasks" }, "textures/ui/quest/tasks");
    form.button({ translate: "sc.menu.bestiary" }, "textures/ui/quest/biogeography");
    form.button({ translate: "sc.menu.weekly" }, "textures/ui/quest/weekly_routine");
    form.button({ translate: "sc.menu.achievements" }, "textures/ui/quest/achievements");
    form.button({ translate: "sc.menu.credits" }, "textures/ui/quest/credits");
    form.button({ translate: "stonecraft.settings.button" }, "textures/ui/quest/settings");
    form.divider();
    const attrParts = [];
    for (const def of ATTRIBUTE_DEFS) {
        const level = getOrZero(player, def.playerKey, 0);
        if (level > 0) {
            attrParts.push({
                rawtext: [
                    { translate: `stonecraft.attribute.${def.id}` },
                    { text: ` Lv.${level}` }
                ]
            });
        }
    }
    const attrMessage = attrParts.length > 0
        ? { rawtext: attrParts.reduce((acc, part, i) => {
              if (i > 0) acc.push({ text: ", " });
              acc.push(part);
              return acc;
          }, []) }
        : { translate: "stonecraft.attributes.none" };

    form.label(attrMessage);
    const stoneHeart = getStoneHeart(player);
    const stoneHeartMax = getStoneHeartMax(player);
    form.label({
        translate: "stonecraft.stone_heart.info",
        with: { rawtext: [{ text: stoneHeart.toString() }, { text: stoneHeartMax.toString() }] }
    });
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showTaskChapters(player); break;
            case 1: showBestiary(player); break;
            case 2: showWeeklyMenu(player); break;
            case 3: showAchievements(player); break;
            case 4: showCredits(player); break;
            case 5: showSettingsMenu(player, showMainMenu); break;
        }
    });
}

//任务系统
function showTaskChapters(player) {
    const form = new ActionFormData();
    form.title({ translate: "sc.menu.tasks" });
    form.body({ translate: "sc.menu.tasks.body" });
    const taskChapters = CHAPTERS.filter(ch => 
        !["sc_biogeography", "sc_achievements"].includes(ch.id)
    );
    for (const chapter of taskChapters) {
        form.button(chapter.title, chapter.iconPath);
    }
    form.button({ translate: "gui.back" });
    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = taskChapters.length;
        if (response.selection === total) {
            showMainMenu(player);
            return;
        }
        const selectedChapter = taskChapters[response.selection];
        showChapterQuests(player, selectedChapter, () => showTaskChapters(player));
    });
}

function showChapterQuests(player, chapter, backCallback) {
    const form = new ActionFormData();
    form.title(chapter.title);
    if (chapter.description) form.body(chapter.description);
    for (const quest of chapter.quests) {
        let buttonText = quest.title;
        if (isQuestCompleted(player, quest)) {
            buttonText = { rawtext: [quest.title, { text: " \xA72\u2714" }] };
        }
        form.button(buttonText, quest.iconPath);
    }
    form.button({ translate: "gui.back" });
    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = chapter.quests.length;
        if (response.selection === total) {
            if (backCallback) backCallback(player);
            return;
        }
        const selectedQuest = chapter.quests[response.selection];
        const returnToChapter = () => showChapterQuests(player, chapter, backCallback);
        showQuestDetail(player, selectedQuest, returnToChapter);
    });
}

function showQuestDetail(player, quest, returnCallback) {
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
        if (response.canceled || response.selection === undefined) return;
        if (response.selection === 0) {
            if (returnCallback) {
                returnCallback(player);
            } else {
                showQuestBook(player);
            }
        } else if (response.selection === 1) {
            if (isCompleted) {
                if (returnCallback) {
                    returnCallback(player);
                } else {
                    showQuestBook(player);
                }
            } else {
                tryCompleteQuest(player, quest, returnCallback);
            }
        }
    });
}

function tryCompleteQuest(player, quest, returnCallback) {
    if (isQuestCompleted(player, quest)) {
        displayMessage(player, { translate: "quest.already_completed" });
        if (returnCallback) {
            returnCallback(player);
        } else {
            showQuestBook(player);
        }
        return;
    }

    const result = checkQuestConditionWithQuest(player, quest);

    if (!result.success) {
        displayMessage(player, { rawtext: result.messages });
        showQuestDetail(player, quest, returnCallback);
        return;
    }

    markQuestCompleted(player, quest);
    giveQuestAward(player, quest);

    if (returnCallback) {
        returnCallback(player);
    } else {
        showQuestBook(player);
    }
}

//生物志
function showBestiary(player) {
    const bestiaryChapter = CHAPTERS.find(ch => ch.id === "sc_biogeography");
    const allQuests = bestiaryChapter.quests;
    const bossQuests = allQuests.filter(q => 
        q.condition.killEntity && BOSS_ENTITIES.includes(q.condition.killEntity.entityType)
    );
    const normalQuests = allQuests.filter(q => 
        q.condition.killEntity && !BOSS_ENTITIES.includes(q.condition.killEntity.entityType)
    );

    const form = new ActionFormData()
        .title({ translate: "sc.menu.bestiary" })
        .body({ translate: "sc.menu.bestiary.body" })
        .button({ translate: "sc.bestiary.normal" })
        .button({ translate: "sc.bestiary.boss" })
        .button({ translate: "gui.back" });
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === 0) {
            showQuestList(player, normalQuests, { translate: "sc.bestiary.normal" }, showBestiary);
        } else if (response.selection === 1) {
            showQuestList(player, bossQuests, { translate: "sc.bestiary.boss" }, showBestiary);
        } else if (response.selection === 2) {
            showMainMenu(player);
        }
    });
}

function showQuestList(player, quests, title, backCallback) {
    const form = new ActionFormData().title(title);
    for (const quest of quests) {
        let buttonText = quest.title;
        if (isQuestCompleted(player, quest)) {
            buttonText = { rawtext: [quest.title, { text: " \xA72\u2714" }] };
        }
        form.button(buttonText, quest.iconPath);
    }
    form.button({ translate: "gui.back" });
    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = quests.length;
        if (response.selection === total) {
            if (backCallback) backCallback(player);
            return;
        }
        const selectedQuest = quests[response.selection];
        showQuestDetailWithBack(player, selectedQuest, () => showQuestList(player, quests, title, backCallback));
    });
}

function showQuestDetailWithBack(player, quest, backCallback) {
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
            if (backCallback) backCallback(player);
            return;
        }
        if (response.selection === 0) {
            if (backCallback) backCallback(player);
        } else if (response.selection === 1) {
            if (isCompleted) {
                if (backCallback) backCallback(player);
            } else {
                tryCompleteQuestWithBack(player, quest, backCallback);
            }
        }
    });
}

function tryCompleteQuestWithBack(player, quest, backCallback) {
    if (isQuestCompleted(player, quest)) {
        displayMessage(player, { translate: "quest.already_completed" });
        if (backCallback) backCallback(player);
        return;
    }
    const result = checkQuestConditionWithQuest(player, quest);
    if (!result.success) {
        displayMessage(player, { rawtext: result.messages });
        showQuestDetailWithBack(player, quest, backCallback);
        return;
    }
    markQuestCompleted(player, quest);
    giveQuestAward(player, quest);
    if (backCallback) backCallback(player);
}
