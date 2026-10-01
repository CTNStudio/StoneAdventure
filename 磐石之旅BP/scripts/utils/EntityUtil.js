//@desc 实体工具类
export default class EntityUtil {
    /**
     * @desc 检查实体是否为有效玩家
     * @param entity - 目标实体
     * @returns {boolean}
     */
    static isValidPlayer(entity) {
        return !!entity && entity.typeId === "minecraft:player" && entity.isValid;
    }

    /**
     * @desc 检查实体是否有效
     * @param entity - 目标实体
     * @returns {boolean}
     */
    static isValidEntity(entity) {
        return !!entity && entity.isValid;
    }

    /**
     * @desc 安全获取实体组件
     * @param entity - 目标实体
     * @param componentId - 组件ID
     * @returns {Component|undefined}
     */
    static getComponent(entity, componentId) {
        if (!EntityUtil.isValidEntity(entity)) return undefined;
        try {
            return entity.getComponent(componentId) ?? undefined;
        } catch {
            return undefined;
        }
    }
}