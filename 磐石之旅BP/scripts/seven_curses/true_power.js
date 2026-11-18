//祝福 7：部分物品的真正力量得以释放
//
//这里只放「配置表 + 查询函数」。业务模块（罗盘、武器、工具……）只问
//「这名玩家用这件物品该走哪组数值」，不要在自己的代码里直接写 hasBless(player, 7)，
//否则以后加第三件物品就要去三个模块里各改一遍。
//
//语义：祝福生效时，把表中给出的数值当作该物品的**上限**——
//实际取值 = min(物品原本的数值, 表中数值)。所以祝福只会让东西变好，
//不会把某条本来就更便宜的单条配置抬回去。
import { hasBless } from "./index.js";
import { BLESS } from "./bless.js";

export const TRUE_POWER_BLESS_ID = BLESS.truePower;

export const TRUE_POWER = {
    //寻迹罗盘：石源 50 → 10，冷却 6000 tick → 1200 tick（60 秒）
    "stonecraft:trail_compass": {
        stonePointCost: 10,
        cooldownTicks: 1200
    }
};

/**
 * 取某件物品对这名玩家的「真正力量」数值。
 * @returns {{ stonePointCost?: number, cooldownTicks?: number } | undefined}
 *          未配置该物品、或玩家没有第 7 祝福时返回 undefined。
 */
export function truePowerOf(player, itemId) {
    const entry = TRUE_POWER[itemId];
    if (!entry) return undefined;
    if (!hasBless(player, TRUE_POWER_BLESS_ID)) return undefined;
    return entry;
}
