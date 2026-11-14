import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { getStonePoint, removeStonePoint } from "../stone_point.js";
import { displayMessage, messageChannels } from "../messageManager.js";
import { locatorEntries, locatorCost } from "./locator_config.js";
import { locateBiome, locateStructure, isInsideBiome } from "./locator_locate.js";

const cooldownKey = "stonecraft:locator_cooldown";

function costOf(entry) {
    return entry.cost ?? locatorCost.stonePoint;
}

function cooldownOf(entry) {
    return entry.cooldown ?? locatorCost.cooldownTicks;
}

function cooldownLeft(player) {
    const until = player.getDynamicProperty(cooldownKey);
    if (typeof until !== "number") return 0;
    return Math.max(0, until - system.currentTick);
}

function setCooldown(player, ticks) {
    player.setDynamicProperty(cooldownKey, system.currentTick + ticks);
}

function nameKeyOf(entry) {
    return `stonecraft.locator.entry.${entry.id.split(":")[1]}`;
}

function statusBody(player) {
    const parts = [{ translate: "stonecraft.locator.status_stone" }, { text: String(getStonePoint(player)) }, { text: "\n" }];
    const left = cooldownLeft(player);
    if (left > 0) {
        const total = Math.ceil(left / 20);
        parts.push({ translate: "stonecraft.locator.status_cooldown" }, { text: `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}` });
    } else {
        parts.push({ translate: "stonecraft.locator.status_ready" });
    }
    return { rawtext: parts };
}

function entryLabel(entry) {
    return { translate: nameKeyOf(entry) };
}

export function openMenu(player) {
    const form = new ActionFormData()
        .title({ translate: "stonecraft.locator.title" })
        .body(statusBody(player));

    // 编号必须和下面的顺序一致：先群系、后结构
    const biomeEntries = locatorEntries.filter(e => e.kind === "biome");
    const structureEntries = locatorEntries.filter(e => e.kind === "structure");
    const ordered = [...biomeEntries, ...structureEntries];

    form.divider();
    form.label({ translate: "stonecraft.locator.group_biome" });
    for (const entry of biomeEntries) form.button(entryLabel(entry));

    form.divider();
    form.label({ translate: "stonecraft.locator.group_structure" });
    for (const entry of structureEntries) form.button(entryLabel(entry));

    form.show(player).then(response => {
        if (response.canceled || response.selection === undefined) return;
        const entry = ordered[response.selection];
        if (!entry) return;
        openConfirm(player, entry);
    }).catch(() => { });
}

function openConfirm(player, entry) {
    new ActionFormData()
        .title({ translate: nameKeyOf(entry) })
        .body(statusBody(player))
        .button({ translate: "stonecraft.locator.btn_locate" })
        .button({ translate: "stonecraft.locator.btn_back" })
        .show(player)
        .then(response => {
            if (response.canceled) {
                openMenu(player);
                return;
            }
            if (response.selection === 0) {
                doLocate(player, entry);
                return;
            }
            openMenu(player);
        })
        .catch(() => { });
}

function doLocate(player, entry) {
    const left = cooldownLeft(player);
    if (left > 0) {
        displayMessage(player, {
            rawtext: [{ translate: "stonecraft.locator.still_cooling" }, { text: String(Math.ceil(left / 20)) }]
        }, { channel: messageChannels.chat });
        return;
    }

    const cost = costOf(entry);
    if (getStonePoint(player) < cost) {
        displayMessage(player, {
            rawtext: [{ translate: "stonecraft.locator.no_stone" }, { text: String(cost) }]
        }, { channel: messageChannels.chat });
        return;
    }

    if (entry.kind === "biome") {
        const found = locateBiome(player, entry.id);
        if (!found.ok) {
            displayMessage(player, { translate: found.key }, { channel: messageChannels.chat });
            return;
        }
        if (isInsideBiome(player, entry.id, found.location)) {
            displayMessage(player, { translate: "stonecraft.locator.already_here" }, { channel: messageChannels.chat });
            return;
        }
        removeStonePoint(player, cost);
        setCooldown(player, cooldownOf(entry));
        const at = found.location;
        displayMessage(player, {
            rawtext: [
                { translate: "stonecraft.locator.success_biome" },
                { text: `${Math.round(at.x)}, ${Math.round(at.y)}, ${Math.round(at.z)}` },
                { translate: "stonecraft.locator.distance" },
                { text: String(found.distance) },
                { translate: "stonecraft.locator.blocks" }
            ]
        }, { channel: messageChannels.chat });
        return;
    }

    const found = locateStructure(player, entry);
    if (!found.ok) {
        displayMessage(player, { translate: found.key }, { channel: messageChannels.chat });
        return;
    }
    removeStonePoint(player, cost);
    setCooldown(player, cooldownOf(entry));
    displayMessage(player, { translate: "stonecraft.locator.success_structure" }, { channel: messageChannels.chat });
}

export { openMenu as openLocator };
