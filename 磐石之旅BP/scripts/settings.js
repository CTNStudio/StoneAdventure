import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

export const displayModes = {
    chat: "chat",
    ui: "ui"
};

const storageKey = "stonecraft:display_mode";
const modeKeys = {
    [displayModes.chat]: "stonecraft.settings.mode.chat",
    [displayModes.ui]: "stonecraft.settings.mode.ui"
};

export function getDisplayMode(player) {
    const mode = player.getDynamicProperty(storageKey);
    return Object.values(displayModes).includes(mode) ? mode : displayModes.ui;
}

export function setDisplayMode(player, mode) {
    if (Object.values(displayModes).includes(mode)) {
        player.setDynamicProperty(storageKey, mode);
    }
}

export function showSettingsMenu(player, backCallback) {
    const form = new ActionFormData()
        .title({ translate: "stonecraft.settings.title" })
        .body({ translate: "stonecraft.settings.body" })
        .button({ translate: "stonecraft.settings.stone_heart" })
        .button({ translate: "gui.back" });

    form.show(player).then(response => {
        if (response.canceled) return;
        if (response.selection === 1) {
            if (backCallback) backCallback(player);
            return;
        }
        if (response.selection === 0) {
            showStoneHeartSettings(player, () => showSettingsMenu(player, backCallback));
        }
    });
}

function showStoneHeartSettings(player, backCallback) {
    const form = new ModalFormData()
        .title({ translate: "stonecraft.settings.stone_heart" })
        .dropdown(
            { translate: "stonecraft.settings.display_mode" },
            [
                { translate: "stonecraft.settings.mode.chat" },
                { translate: "stonecraft.settings.mode.ui" }
            ]
        );

    form.show(player).then(response => {
        if (response.canceled) return;
        if (backCallback) backCallback(player);

        const selectedIndex = response.formValues?.[0];
        const selectedMode = selectedIndex === 1 ? displayModes.ui : displayModes.chat;
        setDisplayMode(player, selectedMode);
        player.sendMessage({
            translate: "stonecraft.settings.changed",
            with: { rawtext: [{ translate: modeKeys[selectedMode] }] }
        });
        if (backCallback) backCallback(player);
    });
}