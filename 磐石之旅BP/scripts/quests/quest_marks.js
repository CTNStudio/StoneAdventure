// 任务/成就/周常/生物志 列表的状态标记
// 这些常量只用于“显示”，不参与任何奖励判定、提交或领取逻辑。
// 颜色语言：橙色 = 有奖励还没到手；§2✔ = 已经到手。

export const COLOR_CLAIMABLE = "\xA76"; // 橙色：奖励待领取
export const COLOR_DONE = "\xA72";      // 暗绿：已领奖 / 已完成
export const COLOR_RESET = "\xA7r";
export const GLYPH_SUBMIT = "\u25C6";   // ◆ 可提交
export const GLYPH_DONE = "\u2714";     // ✔ 已领奖 / 已完成

// 标题可能是 {translate:...} 也可能是纯字符串，统一成 rawtext 节点
export function titleNode(title) {
    return typeof title === "string" ? { text: title } : title;
}
