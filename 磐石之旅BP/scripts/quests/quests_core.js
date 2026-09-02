import { world, ItemStack, Player } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { CHAPTERS } from "./quests.js";
import { showAchievements, getUseCount, resetUseCount, getUseItemCount, resetUseItemCounts } from "./achievements.js";

const NAMESPACE = "stonecraft";
const QUEST_BOOK_ID = `${NAMESPACE}:stone_encyclopedia`;
const kill_prefix = "kill_progress_"; // 动态属性键前缀

/**
 * 增加某个任务的击杀计数
 * @param {Player} player
 * @param {string} questId
 * @param {number} increment
 */
export function addKillCount(player, questId, increment = 1) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    const current = player.getDynamicProperty(key) ?? 0;
    player.setDynamicProperty(key, current + increment);
}

/**
 * 获取某个任务的当前击杀计数
 */
export function getKillCount(player, questId) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    return player.getDynamicProperty(key) ?? 0;
}

/**
 * 重置击杀计数（任务完成时调用）
 */
export function resetKillCount(player, questId) {
    const key = `${NAMESPACE}:${kill_prefix}${questId}`;
    player.setDynamicProperty(key, 0);
}

const entityToQuests = new Map();

const BOSS_ENTITIES = [
    "stonecraft:ancient_stone_totem",
    // 后续可以增加boss（会有的对吧）
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

function giveItem(player, itemStack) {
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
                with: { rawtext: [tagItem.name] }  // 只有一个参数，仍用 rawtext 包裹
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
    }
    else {
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
    if ((!award.items || award.items.length === 0) && !award.exp && !award.level) {
        body.rawtext.push({ translate: "quest.award.none" });
    }

    return body;
}


// UI 函数
function showCredits(player) { //制作名单
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

export function showQuestBook(player) {
    showMainMenu(player);
}

export function showMainMenu(player) { //主页面
    const form = new ActionFormData()
        .title({ translate: "stonecraft.item.stone_encyclopedia" })
        .body({ translate: "stonecraft.item.stone_encyclopedia.body" });
    form.button({ translate: "sc.menu.tasks" }, "textures/ui/quest/tasks");
    form.button({ translate: "sc.menu.bestiary" }, "textures/ui/quest/biogeography");
    form.button({ translate: "sc.menu.achievements" }, "textures/ui/quest/achievements");
    form.button({ translate: "sc.menu.credits" }, "textures/ui/quest/credits");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showTaskChapters(player); break;
            case 1: showBestiary(player); break;
            case 2: showAchievements(player); break;
            case 3: showCredits(player); break;
        }
    });
}

function showTaskChapters(player) { //任务
    const form = new ActionFormData();
    form.title({ translate: "sc.menu.tasks" });
    form.body({ translate: "sc.menu.tasks.body" });
    const taskChapters = CHAPTERS.filter(ch => 
        !["sc_biogeography", "sc_achievements"].includes(ch.id)
    ); //筛选不为生物志和成就的表单
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
        player.sendMessage({ translate: "quest.already_completed" });
        if (returnCallback) {
            returnCallback(player);
        } else {
            showQuestBook(player);
        }
        return;
    }

    const result = checkQuestConditionWithQuest(player, quest);

    if (!result.success) {
        player.sendMessage({ rawtext: result.messages });
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

// 事件监听
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

// 生物志分类
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
        player.sendMessage({ translate: "quest.already_completed" });
        if (backCallback) backCallback(player);
        return;
    }
    const result = checkQuestConditionWithQuest(player, quest);
    if (!result.success) {
        player.sendMessage({ rawtext: result.messages });
        showQuestDetailWithBack(player, quest, backCallback);
        return;
    }
    markQuestCompleted(player, quest);
    giveQuestAward(player, quest);
    if (backCallback) backCallback(player);
}

export function checkAutoAchievement(player, quest) {
    if (!player || !quest) return false;
    if (quest.autoComplete !== true) return false;
    if (isQuestCompleted(player, quest)) return false;

    const result = checkQuestConditionWithQuest(player, quest);

    if (!result.success) {
        return false;
    }
    markQuestCompleted(player, quest);
    giveQuestAward(player, quest);

    return true;
}

export { giveItem };