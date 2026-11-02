//StoneAPI 风格的成就注册表
//用法：
//    import { AchievementRegistry } from "../lib/CustomAchievement/index.js";
//    const achievements = new AchievementRegistry()
//        .autoRegisterFromChapters(CHAPTERS)   // 自动登记 sc_achievements 章节
//        .register({ id: "custom.achievement.xxx", title: "标题键或文本", subtitle: "副标题", icon: "textures/..." })
//        .start();
//    achievements.grant(player, "custom.achievement.xxx");            // 达成（自动去重）
//    achievements.grant(player, id, { repeat: true });                 // 强制再弹一次
import {
	ACHIEVEMENT_CHAPTER_ID,
	collectAchievementDefinitions,
	tagOf,
} from "./definitions.js";

const TOAST_PREFIX = "bob.toast;";
const DEFAULT_SOUND = "ui.achievement.challenge_complete";

export class AchievementRegistry {
	constructor(options = {}) {
		/** @type {Map<string, {id:string, questId?:string, title:string, subtitle:string, icon:string}>} */
		this.entries = new Map();
		this.soundId = options.soundId === null ? undefined : options.soundId ?? DEFAULT_SOUND;
		this.started = false;
	}

	register(definition) {
		if (!definition || typeof definition.id !== "string" || !definition.id) return this;
		this.entries.set(definition.id, {
			id: definition.id,
			questId: definition.questId,
			title: definition.title ?? definition.id,
			subtitle: definition.subtitle ?? "",
			icon: definition.icon,
		});
		return this;
	}

	/** 从章节表批量登记（默认 sc_achievements） */
	autoRegisterFromChapters(chapters, chapterId = ACHIEVEMENT_CHAPTER_ID) {
		for (const definition of collectAchievementDefinitions(chapters, chapterId)) {
			this.register(definition);
		}
		return this;
	}

	get(id) {
		return this.entries.get(id);
	}

	getAll() {
		return [...this.entries.values()];
	}

	start() {
		this.started = true;
		return this;
	}

	/** 是否已达成 */
	has(player, id) {
		try {
			return !!player?.isValid && player.hasTag(tagOf(id));
		} catch {
			return false;
		}
	}

	/** 清除达成标记（调试用） */
	reset(player, id) {
		try {
			if (player?.isValid) player.removeTag(tagOf(id));
		} catch {
		}
		return this;
	}

	/**
	 * 达成并弹出成就 Toast
	 * @returns {boolean} 是否真的弹了（未注册/已达成会返回 false）
	 */
	grant(player, id, options = {}) {
		try {
			if (!player?.isValid) return false;
			const definition = this.entries.get(id);
			if (!definition) {
				console.warn(`[Achievement] 未注册的成就：${id}`);
				return false;
			}

			const tag = tagOf(id);
			const already = player.hasTag(tag);
			if (already && options.repeat !== true) return false;
			if (!already) player.addTag(tag);

			//触发 UI：前缀固定为 bob.toast;，后半段与 UI 的 $when_draw 匹配
			player.sendMessage(TOAST_PREFIX + definition.id);

			if (this.soundId) {
				try {
					player.playSound(this.soundId);
				} catch {
				}
			}
			return true;
		} catch (error) {
			console.error("[Achievement] grant failed:", error);
			return false;
		}
	}
}
