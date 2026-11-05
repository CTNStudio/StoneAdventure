//@desc 背包物品查找与操作类：以物品（方块）ID 为单位定位、统计、扣除背包内的该类物品
import { EntityComponentTypes } from "@minecraft/server";
import EntityUtil from "./EntityUtil.js";

export default class HasItems {
    /**
     * @desc 构造
     * @param target - 持有背包的实体（通常是玩家）
     * @param itemId - 物品或方块 ID，可省略 minecraft: 前缀
     */
    constructor(target, itemId) {
        this.target = target;
        this.itemId = HasItems.normalizeId(itemId);
    }

    /**
     * @desc 规范化物品 ID：去空格、补全命名空间
     * @param itemId - 原始 ID
     * @returns {string}
     */
    static normalizeId(itemId) {
        if (typeof itemId !== "string") return "";
        const id = itemId.trim();
        if (!id) return "";
        return id.includes(":") ? id : `minecraft:${id}`;
    }

    /**
     * @desc 获取背包容器
     * @returns {Container|undefined}
     */
    get container() {
        if (!EntityUtil.isValidEntity(this.target)) return undefined;
        try {
            return this.target.getComponent(EntityComponentTypes.Inventory)?.container ?? undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * @desc 所有命中槽位的下标
     * @returns {number[]}
     */
    slots() {
        const container = this.container;
        if (!container || !this.itemId) return [];
        const result = [];
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot);
            if (item && item.typeId === this.itemId) result.push(slot);
        }
        return result;
    }

    /**
     * @desc 所有命中槽位及其物品
     * @returns {Array<{slot: number, item: ItemStack}>}
     */
    entries() {
        const container = this.container;
        if (!container || !this.itemId) return [];
        const result = [];
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot);
            if (item && item.typeId === this.itemId) result.push({ slot, item });
        }
        return result;
    }

    /**
     * @desc 背包内该物品的总数量
     * @returns {number}
     */
    count() {
        const container = this.container;
        if (!container || !this.itemId) return 0;
        let total = 0;
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot);
            if (item && item.typeId === this.itemId) total += item.amount;
        }
        return total;
    }

    /**
     * @desc 数量是否足够
     * @param amount - 需要的数量，默认 1
     * @returns {boolean}
     */
    has(amount = 1) {
        if (!Number.isInteger(amount) || amount <= 0) return false;
        return this.count() >= amount;
    }

    /**
     * @desc 第一个命中槽位的下标
     * @returns {number} 没有则返回 -1
     */
    firstSlot() {
        const slots = this.slots();
        return slots.length > 0 ? slots[0] : -1;
    }

    /**
     * @desc 扣除指定数量；数量不足时不做任何扣除
     * @param amount - 扣除数量，默认 1
     * @returns {boolean} 是否扣除成功
     */
    take(amount = 1) {
        if (!Number.isInteger(amount) || amount <= 0) return false;
        const container = this.container;
        if (!container || !this.itemId) return false;
        if (this.count() < amount) return false;

        let remaining = amount;
        for (let slot = 0; slot < container.size && remaining > 0; slot++) {
            const item = container.getItem(slot);
            if (!item || item.typeId !== this.itemId) continue;
            if (item.amount > remaining) {
                item.amount -= remaining;
                container.setItem(slot, item);
                remaining = 0;
            } else {
                remaining -= item.amount;
                container.setItem(slot, undefined);
            }
        }
        return remaining === 0;
    }

    /**
     * @desc 清空背包内该物品
     * @returns {number} 实际清掉的数量
     */
    takeAll() {
        const container = this.container;
        if (!container || !this.itemId) return 0;
        let removed = 0;
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot);
            if (!item || item.typeId !== this.itemId) continue;
            removed += item.amount;
            container.setItem(slot, undefined);
        }
        return removed;
    }
}
