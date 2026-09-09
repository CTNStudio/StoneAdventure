import { world } from "@minecraft/server";

const NAMESPACE = "stonecraft";
const STONE_POINT_KEY = `${NAMESPACE}:stone_point`;

/**
 * 获取玩家的石源点数
 * @param {Player} player
 * @returns {number}
 */
export function getStonePoint(player) {
    return player.getDynamicProperty(STONE_POINT_KEY) ?? 0;
}

/**
 * 设置玩家的石源点数（不会小于0）
 * @param {Player} player
 * @param {number} amount
 */
export function setStonePoint(player, amount) {
    const value = Math.max(0, amount);
    player.setDynamicProperty(STONE_POINT_KEY, value);
}

/**
 * 增加玩家的石源点数
 * @param {Player} player
 * @param {number} amount
 */
export function addStonePoint(player, amount) {
    if (typeof amount !== 'number' || amount <= 0) return;
    const current = getStonePoint(player);
    setStonePoint(player, current + amount);
}

/**
 * 减少玩家的石源点数（不会低于0）
 * @param {Player} player
 * @param {number} amount
 */
export function removeStonePoint(player, amount) {
    if (typeof amount !== 'number' || amount <= 0) return;
    const current = getStonePoint(player);
    setStonePoint(player, current - amount);
}