//@desc 锁定物品：不可丢弃、不可用于合成、死亡不掉落
import { EntityComponentTypes, ItemLockMode, system, world } from "@minecraft/server";
import EntityUtil from "../lib/StoneAPI/EntityUtil.js";

const LOCKED_ITEM_IDS = new Set([
    "stonecraft:septem_seal_stone",
]);

function applyLock(item) {
    if (!item || !LOCKED_ITEM_IDS.has(item.typeId)) return undefined;
    try {
        if (item.lockMode === ItemLockMode.inventory && item.keepOnDeath) return undefined;
        item.lockMode = ItemLockMode.inventory;
        item.keepOnDeath = true;
    } catch {
        return undefined;
    }
    return item;
}

function getContainer(entity) {
    if (!EntityUtil.isValidEntity(entity)) return undefined;
    try {
        return entity.getComponent(EntityComponentTypes.Inventory)?.container ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * @desc 扫描背包并给受保护物品上锁
 * @param player - 目标玩家
 * @returns {number} 本次新上锁的物品数
 */
export function lockPlayerItems(player) {
    const container = getContainer(player);
    if (!container) return 0;

    let locked = 0;
    for (let slot = 0; slot < container.size; slot++) {
        try {
            const item = applyLock(container.getItem(slot));
            if (!item) continue;
            container.setItem(slot, item);
            locked++;
        } catch {
        }
    }
    return locked;
}

/**
 * @desc 给指定槽位上的受保护物品上锁
 * @param player - 目标玩家
 * @param slot - 背包槽位下标
 * @returns {boolean} 是否发生了上锁
 */
export function lockItemAtSlot(player, slot) {
    const container = getContainer(player);
    if (!container) return false;
    try {
        const item = applyLock(container.getItem(slot));
        if (!item) return false;
        container.setItem(slot, item);
        return true;
    } catch {
        return false;
    }
}

let itemLockInitialized = false;

//低频巡检：物品定义被重载（改 JSON）时，已存在的物品堆栈会被重建，
//lockMode / keepOnDeath 这些运行时属性会丢失，而上面两个事件都不会触发。
//每 200 tick（10 秒）补扫一次，applyLock 对已锁定的物品会直接跳过，开销很小。
const LOCK_SWEEP_INTERVAL = 200;

export function initItemLock() {
    if (itemLockInitialized) return;
    itemLockInitialized = true;

    world.afterEvents.playerSpawn.subscribe((event) => {
        const player = event.player;
        system.run(() => lockPlayerItems(player));
    });

    world.afterEvents.playerInventoryItemChange.subscribe((event) => {
        if (!LOCKED_ITEM_IDS.has(event.itemStack?.typeId)) return;
        const player = event.player;
        const slot = event.slot;
        system.run(() => lockItemAtSlot(player, slot));
    });

    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            try {
                lockPlayerItems(player);
            } catch {
            }
        }
    }, LOCK_SWEEP_INTERVAL);
}
