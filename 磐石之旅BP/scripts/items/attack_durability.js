//攻击耐久修正：基岩版原版「攻击实体」每击扣 2 点耐久，Java 版为 1 点。
//这里用官方的 ItemCustomComponent 钩子 onBeforeDurabilityDamage 把攻击损耗改成 1 点。
//
//该钩子仅在「手持带此组件的物品命中实体、即将扣耐久」时触发：
//  · 不影响破坏方块（原版 1 点）
//  · 不影响使用物品（食物/弓等，原版 1 点）
//  · 连击未造成伤害（无敌帧）时原版同样扣耐久，这里也统一为 1 点
import {
  system,
  world,
} from "@minecraft/server";

//组件 ID：物品 JSON 里以 "stonecraft:attack_durability_1": {} 声明
export const ATTACK_DURABILITY_COMPONENT = "stonecraft:attack_durability_1";

//攻击实体时的耐久损耗（Java 版口径）
const ATTACK_DURABILITY_COST = 1;

export function initAttackDurability() {
  const register = (event) => {
    try {
      if (!event || !event.itemComponentRegistry) {
        console.error("[Stonecraft] itemComponentRegistry is unavailable");
        return;
      }
      event.itemComponentRegistry.registerCustomComponent(
        ATTACK_DURABILITY_COMPONENT,
        {
          //durabilityDamage 是可写属性（官方文档中未标注 read-only）
          onBeforeDurabilityDamage: (durabilityEvent) => {
            try {
              durabilityEvent.durabilityDamage = ATTACK_DURABILITY_COST;
            } catch (e) {
              console.warn("[Stonecraft] attack durability override failed", e);
            }
          },
        }
      );
    } catch (error) {
      console.error("[Stonecraft] attack durability registration failed:", error);
    }
  };

  try {
    if (system.beforeEvents && system.beforeEvents.startup && system.beforeEvents.startup.subscribe) {
      system.beforeEvents.startup.subscribe(register);
      return;
    }
  } catch (error) {
    console.error("[Stonecraft] startup hook failed:", error);
  }

  try {
    if (world.beforeEvents && world.beforeEvents.worldInitialize && world.beforeEvents.worldInitialize.subscribe) {
      world.beforeEvents.worldInitialize.subscribe(register);
      return;
    }
  } catch (error) {
    console.error("[Stonecraft] worldInitialize hook failed:", error);
  }

  console.error("[Stonecraft] no valid initialization event found for attack durability component");
}
