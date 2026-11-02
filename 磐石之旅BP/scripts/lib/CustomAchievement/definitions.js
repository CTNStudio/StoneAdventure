//成就数据提取层：纯数据、无 SDK 依赖，运行时（Bedrock）与生成器（node）共用
import { ACHIEVEMENTS_CHAPTER } from "../../quests/achievements_list.js";

/** 自动登记的章节 id */
export const ACHIEVEMENT_CHAPTER_ID = ACHIEVEMENTS_CHAPTER.id;
/** 成就键前缀（同时作为 UI 的 $when_draw） */
export const ACHIEVEMENT_ID_PREFIX = "custom.achievement.";
/** 缺图标时的兜底 */
export const DEFAULT_ACHIEVEMENT_ICON = "textures/items/nether_star";
/** 达成标记 tag 前缀 */
export const ACHIEVEMENT_TAG_PREFIX = "stonecraft:ach_";

function firstDescriptionLine(description) {
	if (!description) return undefined;
	if (typeof description === "string") return description;
	if (typeof description.translate === "string") return description.translate;
	if (Array.isArray(description.rawtext)) {
		for (const part of description.rawtext) {
			if (typeof part?.translate === "string") return part.translate;
			if (typeof part?.text === "string") {
				const text = part.text.trim();
				if (text && text !== "\n") return text;
			}
		}
	}
	if (typeof description.text === "string" && description.text.trim()) return description.text.trim();
	return undefined;
}

function iconOf(quest) {
	const iconPath = quest?.iconPath;
	if (typeof iconPath === "string") return iconPath;
	if (iconPath && typeof iconPath.texture === "string") return iconPath.texture;
	return DEFAULT_ACHIEVEMENT_ICON;
}

/**
 * 从章节表里提取成就定义
 * @param {Array} chapters 章节数组（默认取 quests.js 的 CHAPTERS）
 * @param {string} chapterId 要提取的章节 id
 */
export function collectAchievementDefinitions(chapters = [ACHIEVEMENTS_CHAPTER], chapterId = ACHIEVEMENT_CHAPTER_ID) {
	const chapter = (chapters ?? []).find((item) => item?.id === chapterId);
	if (!chapter || !Array.isArray(chapter.quests)) return [];

	return chapter.quests.map((quest) => ({
		id: ACHIEVEMENT_ID_PREFIX + quest.id,
		questId: quest.id,
		title: typeof quest.title === "string" ? quest.title : quest.title?.translate ?? quest.id,
		subtitle: firstDescriptionLine(quest.description) ?? "§7成就达成",
		icon: iconOf(quest),
	}));
}

/** 由成就 id 生成去重用的玩家 tag */
export function tagOf(id) {
	return ACHIEVEMENT_TAG_PREFIX + String(id ?? "").replace(/[^a-zA-Z0-9_]/g, "_");
}
