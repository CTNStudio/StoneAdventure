import { displayModes, getDisplayMode } from "./settings.js";

export function displayMessage(player, message, options = {}) {
    const mode = getDisplayMode(player);
    const fallback = options.fallback || displayModes.chat;

    switch (mode) {
        case displayModes.chat:
            player.onScreenDisplay.setActionBar(message);
            break;
        case displayModes.ui:
            if (fallback === displayModes.actionbar) {
                player.onScreenDisplay.setActionBar(message);
            } else {
                player.sendMessage(message);
            }
            break;
        default:
            player.sendMessage(message);
    }
}
