import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { SHOP_TRADES } from "./shop_config.js";
import { addStonePoint } from "../stone_point.js";
import { displayMessage } from "../messageManager.js";
import { showMainMenu } from "../quests/quests_ui.js";

function getPlayerContainer(player) {
    const inventory = player.getComponent("minecraft:inventory");
    return inventory?.container;
}

function hasEnoughItems(player, requirements) {
    const container = getPlayerContainer(player);
    if (!container) return false;
    for (const req of requirements) {
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
    return true;
}

function takeItemsFromPlayer(player, requirements) {
    const container = getPlayerContainer(player);
    if (!container) return false;
    for (const req of requirements) {
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
    return true;
}

export function showShopMenu(player) {
    const form = new ActionFormData()
        .title({ translate: "shop.title" })
        .body({ translate: "shop.body" });

    for (const trade of SHOP_TRADES) {
        form.button(trade.name, trade.iconPath);
    }
    form.button({ translate: "gui.back" });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const total = SHOP_TRADES.length;
        if (response.selection === total) {
            showMainMenu(player);
            return;
        }
        const selectedTrade = SHOP_TRADES[response.selection];
        showTradeDetail(player, selectedTrade);
    });
}

function showTradeDetail(player, trade) {
    const body = { rawtext: [] };
    if (trade.description) {
        body.rawtext.push(trade.description);
        body.rawtext.push({ text: "\n\n" });
    }
    body.rawtext.push({ translate: "shop.requirements" });
    for (const req of trade.requirements) {
        const itemName = req.name || { text: req.itemId };
        body.rawtext.push({ text: "\n" });
        body.rawtext.push({
            translate: "shop.item_count",
            with: { rawtext: [{ text: req.amount.toString() }, itemName] }
        });
    }
    body.rawtext.push({ text: "\n\n" });
    body.rawtext.push({ translate: "shop.rewards" });
    for (const reward of trade.rewards) {
        if (reward.type === "stonePoint") {
            body.rawtext.push({ text: "\n" });
            body.rawtext.push({
                translate: "shop.reward.stone_point",
                with: { rawtext: [{ text: reward.amount.toString() }] }
            });
        }
    }

    const canAfford = hasEnoughItems(player, trade.requirements);
    const form = new MessageFormData()
        .title(trade.name)
        .body(body)
        .button1({ translate: "gui.back" });

    if (canAfford) {
        form.button2({ translate: "shop.buy" });
    } else {
        form.button2({ translate: "shop.cannot_afford" });
    }

    form.show(player).then((response) => {
        if (response.canceled || response.selection === undefined) {
            showShopMenu(player);
            return;
        }
        if (response.selection === 0) {
            showShopMenu(player);
        } else if (response.selection === 1 && canAfford) {
            if (takeItemsFromPlayer(player, trade.requirements)) {
                for (const reward of trade.rewards) {
                    if (reward.type === "stonePoint") {
                        addStonePoint(player, reward.amount);
                    }
                }
                displayMessage(player, { translate: "shop.purchase_success" });
                showShopMenu(player);
            } else {
                displayMessage(player, { translate: "shop.purchase_failed" });
                showTradeDetail(player, trade);
            }
        }
    });
}