import { world, system, Player } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { weekly_pool } from "./quests.js";
import { displayMessage } from "../messageManager.js";
import { checkQuestConditionWithQuest, isQuestCompleted, markQuestCompleted, buildQuestBody,  giveQuestAward, notifyAchievementComplete } from "./quests_core.js";
import { showMainMenu } from "./quests_ui.js";

// 显示周常菜单
export function showWeeklyMenu(player) {
    const weeklyQuests = getWeeklyQuests();
    if (weeklyQuests.length === 0) {
        player.sendMessage({ translate: "sc.weekly.no_quests" });
        showMainMenu(player);
        return;
    }

    const form = new ActionFormData()
        .title({ translate: "sc.menu.weekly" })
        .body({ translate: "sc.weekly.body" });

    for (const quest of weeklyQuests) {
        let buttonText = quest.title;
        const completed = isWeeklyCompleted(player, quest.id);
        const claimed = isWeeklyClaimed(player, quest.id);
        if (completed && claimed) {
            buttonText = { rawtext: [quest.title, { text: " \xA72\u2714" }] };
        } else if (completed && !claimed) {
            buttonText = { rawtext: [quest.title, { translate: "quest.completed" }] };
        } else {
            buttonText = { rawtext: [quest.title, { translate: "quest.not_completed" }] };
        }
        form.button(buttonText, quest.iconPath);
    }
    form.button({ translate: "gui.back" });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = weeklyQuests.length;
        if (response.selection === total) {
            showMainMenu(player);
            return;
        }
        const selectedQuest = weeklyQuests[response.selection];
        showWeeklyQuestDetail(player, selectedQuest);
    });
}

function showWeeklyQuestDetail(player, quest) {
    const completed = isWeeklyCompleted(player, quest.id);
    const claimed = isWeeklyClaimed(player, quest.id);
    const body = buildQuestBody(quest, player);

    const form = new MessageFormData()
        .title(quest.title)
        .body(body)
        .button1({ translate: "gui.back" });

    if (!completed) {
        form.button2({ translate: "quest.not_completed" });
    } else if (completed && !claimed) {
        form.button2({ translate: "quest.claim_reward" });
    } else {
        form.button2({ translate: "quest.reward_claimed" });
    }

    form.show(player).then((response) => {
        if (response.canceled || response.selection === undefined) {
            showWeeklyMenu(player);
            return;
        }
        if (response.selection === 0) {
            showWeeklyMenu(player);
        } else if (response.selection === 1) {
            if (!completed) {
                player.sendMessage({ translate: "quest.not_completed_yet" });
                showWeeklyQuestDetail(player, quest);
            } else if (completed && !claimed) {
                // 发放奖励
                giveQuestAward(player, quest);
                setWeeklyClaimed(player, quest.id);
                player.playSound("random.orb");
                displayMessage(player, { translate: "quest.reward_claimed_success" });
                showWeeklyMenu(player);
            } else {
                player.sendMessage({ translate: "quest.reward_already_claimed" });
                showWeeklyMenu(player);
            }
        }
    });
}

const NAMESPACE = "stonecraft";
const weekly_week_key = `${NAMESPACE}:weekly_week`;
const weekly_quests_key = `${NAMESPACE}:weekly_quests`;
const weekly_completed_prefix = `${NAMESPACE}:weekly_completed_`;
const weekly_claimed_prefix = `${NAMESPACE}:weekly_claimed_`;

// 获取当前游戏周（从第0周开始，每7天算一周）
function getCurrentWeek() {
    return Math.floor(world.getDay() / 7);
}

// 洗牌算法（Fisher–Yates）
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 从池中随机抽取三个不重复的任务
function pickWeeklyQuests() {
    const shuffled = shuffleArray([...weekly_pool]);
    return shuffled.slice(0, 3).map(q => q.id);
}

// 刷新周常（当游戏周变化时调用）
export function refreshWeeklyIfNeeded() {
    const currentWeek = getCurrentWeek();
    const storedWeek = world.getDynamicProperty(weekly_week_key);
    if (storedWeek !== undefined && storedWeek === currentWeek) {
        return; // 无需刷新
    }

    // 周数变化，重新抽取
    const newQuests = pickWeeklyQuests();
    world.setDynamicProperty(weekly_week_key, currentWeek);
    world.setDynamicProperty(weekly_quests_key, JSON.stringify(newQuests));

    // 重置所有玩家的完成/领取状态
    for (const player of world.getAllPlayers()) {
        for (const questId of newQuests) {
            player.setDynamicProperty(`${weekly_completed_prefix}${questId}`, false);
            player.setDynamicProperty(`${weekly_claimed_prefix}${questId}`, false);
        }
    }
     world.sendMessage({ translate: "quest.reset" });
}

// 获取本周三个任务对象
export function getWeeklyQuests() {
    const questsJson = world.getDynamicProperty(weekly_quests_key);
    if (!questsJson) return [];
    try {
        const questIds = JSON.parse(questsJson);
        return questIds.map(id => weekly_pool.find(q => q.id === id)).filter(Boolean);
    } catch {
        return [];
    }
}

// 检查玩家是否已完成某个周常任务
export function isWeeklyCompleted(player, questId) {
    return player.getDynamicProperty(`${weekly_completed_prefix}${questId}`) ?? false;
}

// 检查玩家是否已领取奖励
export function isWeeklyClaimed(player, questId) {
    return player.getDynamicProperty(`${weekly_claimed_prefix}${questId}`) ?? false;
}

// 标记周常任务为已完成
export function setWeeklyCompleted(player, questId) {
    player.setDynamicProperty(`${weekly_completed_prefix}${questId}`, true);
}

// 标记周常任务已领取奖励
export function setWeeklyClaimed(player, questId) {
    player.setDynamicProperty(`${weekly_claimed_prefix}${questId}`, true);
}

// 检查并自动完成某个周常任务（如果条件满足）
export function checkWeeklyProgress(player, quest) {
    if (!player || !quest) return false;
    if (isWeeklyCompleted(player, quest.id)) return false;
    if (isWeeklyClaimed(player, quest.id)) return false;

    const result = checkQuestConditionWithQuest(player, quest);
    if (!result.success) return false;

    // 条件满足，标记完成
    setWeeklyCompleted(player, quest.id);
    // 发送通知（使用成就完成通知）
    notifyAchievementComplete(player, quest); // 复用成就通知
    return true;
}

// 在玩家登录时刷新
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    system.run(() => {
        refreshWeeklyIfNeeded();
    });
});

// 定期检查（每20 tick检查一次，确保不会错过刷新）
system.runInterval(() => {
    refreshWeeklyIfNeeded();
}, 20);