//@desc 背包工具类
import {
    EquipmentSlot,
    EntityComponentTypes,
    ItemStack,
} from "@minecraft/server";
import EntityUtil from "./EntityUtil.js";

export default class InventoryUtil {
    /**
     * @desc 获取实体的背包容器
     * @param target - 目标实体
     * @returns {Container|undefined}
     */
    static getContainer(target) {
        if (!EntityUtil.isValidEntity(target)) return undefined;
        try {
            const inventory = target.getComponent(EntityComponentTypes.Inventory);
            return inventory?.container ?? undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * @desc 获取实体主手物品
     * @param target - 目标实体
     * @returns {ItemStack|undefined}
     */
    static getMainHandItem(target) {
        if (!EntityUtil.isValidEntity(target)) return undefined;
        try {
            const equippable = target.getComponent(EntityComponentTypes.Equippable);
            return equippable?.getEquipment(EquipmentSlot.Mainhand) ?? undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * @desc 设置实体主手物品
     * @param target - 目标实体
     * @param item - ItemStack 或 undefined（清空）
     * @returns {boolean}
     */
    static setMainHandItem(target, item) {
        if (!EntityUtil.isValidEntity(target)) return false;
        try {
            const equippable = target.getComponent(EntityComponentTypes.Equippable);
            if (!equippable) return false;
            equippable.setEquipment(EquipmentSlot.Mainhand, item);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @desc 将物品放入实体背包，无位置则生成在脚下
     * @param target - 目标实体
     * @param item - ItemStack
     * @returns {boolean}
     */
    static giveItem(target, item) {
        if (!EntityUtil.isValidEntity(target) || !item) return false;
        try {
            const container = InventoryUtil.getContainer(target);
            if (container) {
                const leftover = container.addItem(item);
                if (!leftover) return true;
                target.dimension.spawnItem(leftover, target.location);
                return true;
            }
            target.dimension.spawnItem(item, target.location);
            return true;
        } catch {
            try {
                target.dimension.spawnItem(item, target.location);
                return true;
            } catch {
                return false;
            }
        }
    }

    /**
     * @desc 从指定槽位扣除物品
     * @param target - 目标实体
     * @param slot - 槽位下标或 ContainerSlot
     * @param amount - 扣除数量
     * @returns {boolean}
     */
    static takeItem(target, slot, amount) {
        if (!EntityUtil.isValidEntity(target)) return false;
        if (!Number.isInteger(amount) || amount <= 0) return false;
        try {
            let containerSlot;
            if (Number.isInteger(slot)) {
                const container = InventoryUtil.getContainer(target);
                if (!container) return false;
                if (slot < 0 || slot >= container.size) return false;
                containerSlot = container.getSlot(slot);
            } else if (slot && typeof slot.getItem === "function") {
                containerSlot = slot;
            } else {
                return false;
            }

            const item = containerSlot.getItem();
            if (!item || item.amount < amount) return false;

            if (item.amount === amount) {
                containerSlot.setItem(undefined);
            } else {
                item.amount -= amount;
                containerSlot.setItem(item);
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @desc 统计背包中指定物品的总数量
     * @param container - 容器
     * @param itemId - 物品ID
     * @returns {number}
     */
    static countItem(container, itemId) {
        if (!container) return 0;
        let count = 0;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === itemId) {
                count += item.amount;
            }
        }
        return count;
    }

    /**
     * @desc 检查玩家是否满足一组需求
     * @param player - 玩家
     * @param requirements - 需求数组
     * @returns {boolean}
     */
    static hasEnoughItems(player, requirements) {
        if (!Array.isArray(requirements)) return false;
        const container = InventoryUtil.getContainer(player);
        for (const req of requirements) {
            if (req.type === "stonePoint") {
                continue;
            }
            if (!container) return false;
            if (InventoryUtil.countItem(container, req.itemId) < req.amount) {
                return false;
            }
        }
        return true;
    }

    /**
     * @desc 从玩家背包扣除一组物品
     * @param player - 玩家
     * @param requirements - 需求数组
     * @returns {boolean}
     */
    static takeItems(player, requirements) {
        if (!Array.isArray(requirements)) return false;
        const container = InventoryUtil.getContainer(player);
        if (!container) return false;
        for (const req of requirements) {
            if (req.type === "stonePoint") continue;
            let remaining = req.amount;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (!item || item.typeId !== req.itemId) continue;
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
            if (remaining > 0) return false;
        }
        return true;
    }
}