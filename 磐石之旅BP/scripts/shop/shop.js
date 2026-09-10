import { ActionFormData } from "@minecraft/server-ui";
import { ItemStack, system } from "@minecraft/server";
import { giveItem } from "../quests/quests_core.js";
import { SHOP_TRADES } from "./shop_config.js";
import { addStonePoint, getStonePoint, removeStonePoint } from "../stone_point.js";
import { showMainMenu } from "../quests/quests_ui.js";

function getPlayerContainer(player) {
    const inventory = player.getComponent("minecraft:inventory");
    return inventory?.container;
}

function hasEnoughItems(player, requirements) {
    const container = getPlayerContainer(player);
    for (const req of requirements) {
        if (req.type === "stonePoint") {
            if (getStonePoint(player) < req.amount) return false;
        } else {
            if (!container) return false;
            let count = 0;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item?.typeId === req.itemId) {
                    count += item.amount;
                    if (count >= req.amount) break;
                }
            }
            if (count < req.amount) return false;
        }
    }
    return true;
}

function takeItemsFromPlayer(player, requirements) {
    const container = getPlayerContainer(player);
    for (const req of requirements) {
        if (req.type === "stonePoint") {
            if (getStonePoint(player) < req.amount) return false;
            removeStonePoint(player, req.amount);
        } else {
            if (!container) return false;
            let remaining = req.amount;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item?.typeId === req.itemId) {
                    if (item.amount > remaining) {
                        item.amount -= remaining;
                        container.setItem(i, item);
                        remaining = 0;
                        break;
                    } else {
                        remaining -= item.amount;
                        container.setItem(i, undefined);
                        if (remaining === 0) break;
                    }
                }
            }
            if (remaining > 0) return false;
        }
    }
    return true;
}

function formatEntry(entry) {
    if (entry.type === "stonePoint") {
        return {
            translate: "sc.shop.stone_point",
            with: { rawtext: [{ text: entry.amount.toString() }] }
        };
    }
    const name = entry.name || { text: entry.itemId };
    return {
        translate: "sc.shop.item_count",
        with: { rawtext: [{ text: entry.amount.toString() }, name] }
    };
}

function buildButtonText(trade) {
    const raw = [trade.name, { text: "  §7" }];
    for (let i = 0; i < trade.requirements.length; i++) {
        if (i > 0) raw.push({ translate: "sc.shop.separator" });
        raw.push(formatEntry(trade.requirements[i]));
    }
    raw.push({ translate: "sc.shop.arrow" });
    for (let i = 0; i < trade.rewards.length; i++) {
        if (i > 0) raw.push({ translate: "sc.shop.separator" });
        raw.push(formatEntry(trade.rewards[i]));
    }
    return { rawtext: raw };
}

function grantRewards(player, trade) {
    for (const reward of trade.rewards) {
        if (reward.type === "stonePoint") {
            addStonePoint(player, reward.amount);
        } else {
            giveItem(player, new ItemStack(reward.itemId, reward.amount));
        }
    }
}

export function showShopMenu(player) {
    const form = new ActionFormData()
        .title({ translate: "shop.title" })
        .body({ translate: "shop.body" });

    for (const trade of SHOP_TRADES) {
        form.button(buildButtonText(trade), trade.iconPath);
    }
    form.button({ translate: "gui.back" });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = SHOP_TRADES.length;
        if (response.selection === total) {
            showMainMenu(player);
            return;
        }

        const trade = SHOP_TRADES[response.selection];

        if (!hasEnoughItems(player, trade.requirements)) {
            player.sendMessage({ translate: "shop.cannot_afford" });
            player.playSound("game.player.attack.nodamage", { volume: 1, pitch: 1 });
        } else if (takeItemsFromPlayer(player, trade.requirements)) {
            grantRewards(player, trade);
            player.sendMessage({ translate: "shop.purchase_success" });
            player.playSound("random.levelup", { volume: 1, pitch: 1 });
        } else {
            player.sendMessage({ translate: "shop.purchase_failed" });
            player.playSound("game.player.attack.nodamage", { volume: 1, pitch: 1 });
        }

        // 延迟一 tick 后刷新商店界面，避免 UI 冲突
        system.run(() => showShopMenu(player));
    });
}