//成就 UI 生成器（开发期运行，不参与游戏内加载）
//   node scripts/lib/CustomAchievement/generate_ui.mjs
// 作用：读取 sc_achievements 章节，把 achievements_stacked 的控件段整体重写，
//      每次新增/删除成就只需跑一次，不用手抄 JSON。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACHIEVEMENT_CHAPTER_ID, collectAchievementDefinitions } from "./definitions.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BP_ROOT = path.resolve(HERE, "..", "..", "..");
//BP 位于 ...\com.mojang\development_behavior_packs\<包名>(BP)，RP 在平行的 development_resource_packs 下
const MOJANG_ROOT = path.dirname(path.dirname(BP_ROOT));
const RP_ROOT = process.env.ACHIEVEMENT_RP_PATH ?? path.join(
	MOJANG_ROOT,
	"development_resource_packs",
	path.basename(BP_ROOT).replace(/\(BP\)$/i, "(RP)")
);
const HUD_PATH = path.join(RP_ROOT, "ui", "hud_screen.json");

function findBlockEnd(text, startIndex) {
	// 从 '{' 位置开始做括号配对（忽略字符串与注释）
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = startIndex; i < text.length; i++) {
		const c = text[i];
		const n = text[i + 1];
		if (inString) {
			if (escaped) escaped = false;
			else if (c === "\\") escaped = true;
			else if (c === '"') inString = false;
			continue;
		}
		if (c === '"') { inString = true; continue; }
		if (c === "/" && n === "/") { while (i < text.length && text[i] !== "\n") i++; continue; }
		if (c === "{") depth++;
		else if (c === "}") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

const definitions = collectAchievementDefinitions(undefined, ACHIEVEMENT_CHAPTER_ID);
if (definitions.length === 0) {
	console.error(`[generate_ui] 章节 ${ACHIEVEMENT_CHAPTER_ID} 没有成就，放弃写入`);
	process.exit(1);
}

const controls = [
	`      {
        "pudding": {
          "type": "panel",
          "size": [ 0, 2 ]
        }
      }`,
	...definitions.map(
		(def) => `      {
        "${def.id}@hud.achievement_element": {
          "$when_draw": ${JSON.stringify(def.id)},
          "$uv": [ 0, 0 ],
          "$achievement_icon": ${JSON.stringify(def.icon ?? "textures/items/nether_star")},
          "$achievement_text": ${JSON.stringify(def.title)},
          "$content_text": ${JSON.stringify(def.subtitle)}
        }
      }`
	),
].join(",\n");

const block = `"achievement_stacked": {
    "type": "panel",
    "anchor_from": "top_right",
    "anchor_to": "top_right",
    "size": [ "100%c", "100%c" ],
    "controls": [
${controls}
    ]
  },`;

let text = fs.readFileSync(HUD_PATH, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

const startPattern = /"achievement_stacked"\s*:\s*\{/;
const match = startPattern.exec(text);
if (!match) {
	console.error("[generate_ui] hud_screen.json 里找不到 achievement_stacked");
	process.exit(1);
}
const openIndex = text.indexOf("{", match.index);
const endIndex = findBlockEnd(text, openIndex);
if (endIndex < 0) {
	console.error("[generate_ui] achievement_stacked 括号不匹配");
	process.exit(1);
}
//吃掉原块后面紧跟的逗号（新块自带结尾逗号，否则会出现 ",,"）
let tailIndex = endIndex + 1;
while (tailIndex < text.length && /[ \t]/.test(text[tailIndex])) tailIndex++;
const hadTrailingComma = text[tailIndex] === ",";
if (hadTrailingComma) tailIndex++;

const before = definitions.length;
text = text.slice(0, match.index) + block + text.slice(tailIndex);
fs.writeFileSync(HUD_PATH, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");

console.log(`[generate_ui] 已写入 ${before} 个成就 -> ${HUD_PATH}`);
for (const def of definitions) console.log(`  ${def.id}  |  ${def.icon}`);