import { displayModes, getDisplayMode } from "./settings.js";

/**
 * 消息通道：调用方声明这条消息"本来"该走哪里
 * - actionbar：短反馈（吃东西、锻造失败、被七咒拦住……）
 * - chat：正式信息（奖励、任务结果、命令反馈……）
 */
export const messageChannels = {
    chat: "chat",
    actionbar: "actionbar",
};

/**
 * 统一的消息出口
 *
 * 路由规则：
 * - displayModes.ui：操作栏被石心数值的 JSON UI 占用，除石心外一律走聊天栏
 * - displayModes.chat：按调用方声明的通道走（聊天栏消息去聊天栏，操作栏消息去操作栏）
 *
 * 石心自身的数值显示不走这里（见 stone_heart_display.js）。
 */
export function displayMessage(player, message, options = {}) {
    if (!player) return;
    const mode = getDisplayMode(player);
    const channel = options.channel ?? messageChannels.actionbar;

    if (mode === displayModes.ui) {
        try {
            player.sendMessage(message);
        } catch {
        }
        return;
    }

    if (channel === messageChannels.actionbar) {
        try {
            player.onScreenDisplay.setActionBar(message);
        } catch {
            try {
                player.sendMessage(message);
            } catch {
            }
        }
        return;
    }

    try {
        player.sendMessage(message);
    } catch {
    }
}
