// 任务/成就/周常/生物志 列表的状态标记
// 这些常量只用于“显示”，不参与任何奖励判定、提交或领取逻辑。
// 颜色语言：橙色 = 有奖励还没到手；§2✔ = 已经到手。

export const COLOR_CLAIMABLE = "\xA76"; // 橙色：奖励待领取
export const COLOR_DONE = "\xA72";      // 暗绿：已领奖 / 已完成
export const COLOR_HINT = "\xA77";      // 灰色：图例文字
export const COLOR_RESET = "\xA7r";
export const GLYPH_SUBMIT = "\u25C6";   // ◆ 可提交
export const GLYPH_DONE = "\u2714";     // ✔ 已领奖 / 已完成

// 标题可能是 {translate:...} 也可能是纯字符串，统一成 rawtext 节点
export function titleNode(title) {
    return typeof title === "string" ? { text: title } : title;
}

// 图例：每类列表只列出该类真实存在的状态
export const LEGEND_TASKS =
    `${COLOR_HINT}图例：${COLOR_CLAIMABLE}橙色名称${COLOR_HINT}=奖励待领取` +
    `  ${COLOR_DONE}${GLYPH_DONE}${COLOR_HINT}=已领奖`;
export const LEGEND_BESTIARY =
    `${COLOR_HINT}图例：${COLOR_CLAIMABLE}${GLYPH_SUBMIT}${COLOR_HINT}=可提交` +
    `  ${COLOR_DONE}${GLYPH_DONE}${COLOR_HINT}=已完成`;
export const LEGEND_CHAPTERS =
    `${COLOR_HINT}图例：${COLOR_CLAIMABLE}橙色章节${COLOR_HINT}=有奖励待领取` +
    `  ${COLOR_DONE}${GLYPH_DONE}${COLOR_HINT}=全部领完`;

// 把一行图例拼到表单 body 末尾，不改动原有文案
export function withLegend(body, legendText) {
    if (!legendText) return body;
    if (body === undefined || body === null || body === "") {
        return { text: legendText };
    }
    if (typeof body === "string") {
        return { text: `${body}\n${legendText}` };
    }
    return { rawtext: [body, { text: `\n${legendText}` }] };
}
