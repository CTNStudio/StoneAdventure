import {
  ItemStack,
  ItemComponentTypes,
  EnchantmentType,
} from "@minecraft/server";

export function serializeItemStack(item) {
  if (!item) return "";
  const data = {
    typeId: item.typeId,
    amount: item.amount ?? 1,
    lore: [],
    dynamic: {},
    enchantments: [],
    customName: undefined,
    durability: undefined,
  };

  try { data.lore = item.getLore?.() ?? []; } catch {}

  // 动态属性：遍历所有 id，只保留基本类型
  try {
    const ids = item.getDynamicPropertyIds?.() ?? [];
    for (const id of ids) {
      const value = item.getDynamicProperty(id);
      if (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean") {
        data.dynamic[id] = value;
      }
    }
  } catch {}

  // 附魔
  try {
    const ench = item.getComponent(ItemComponentTypes.Enchantable);
    if (ench) {
      for (const e of ench.getEnchantments()) {
        data.enchantments.push({
          type: e.type?.id ?? String(e.type),
          level: e.level,
        });
      }
    }
  } catch {}

  // 自定义名称
  try {
    const nameTag = item.nameTag;
    if (typeof nameTag === "string" && nameTag.length > 0) {
      data.customName = nameTag;
    }
  } catch {}

  // 耐久
  try {
    const dur = item.getComponent(ItemComponentTypes.Durability);
    if (dur) {
      data.durability = { damage: dur.damage };
    }
  } catch {}

  return JSON.stringify(data);
}

export function deserializeItemStack(dataText) {
  if (!dataText) return undefined;

  let data;
  try { data = JSON.parse(dataText); } catch { return undefined; }
  if (!data || typeof data !== "object" || !data.typeId) return undefined;

  let item;
  try { item = new ItemStack(data.typeId, data.amount ?? 1); } catch { return undefined; }
  if (!item) return undefined;

  //动态属性
  if (data.dynamic && typeof data.dynamic === "object") {
    for (const [key, value] of Object.entries(data.dynamic)) {
      if (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean") {
        try { item.setDynamicProperty(key, value); } catch {}
      }
    }
  }

  //Lore
  if (Array.isArray(data.lore) && data.lore.length > 0) {
    try { item.setLore(data.lore); } catch {}
  }

  //附魔（先用 EnchantmentType，失败再用字符串，兼容不同版本）
  if (Array.isArray(data.enchantments) && data.enchantments.length > 0) {
    try {
      const ench = item.getComponent(ItemComponentTypes.Enchantable);
      if (ench) {
        for (const e of data.enchantments) {
          try {
            ench.addEnchantment({
              type: new EnchantmentType(e.type),
              level: e.level,
            });
          } catch {
            try {
              ench.addEnchantment({ type: e.type, level: e.level });
            } catch (err) {
              console.warn(`[Serializer] enchant ${e.type} failed`, err);
            }
          }
        }
      }
    } catch {}
  }

  //自定义名称
  if (typeof data.customName === "string" && data.customName.length > 0) {
    try { item.nameTag = data.customName; } catch {}
  }

  //耐久
  if (data.durability && typeof data.durability.damage === "number") {
    try {
      const dur = item.getComponent(ItemComponentTypes.Durability);
      if (dur) dur.damage = data.durability.damage;
    } catch (err) {
      console.warn("[Serializer] durability restore skipped:", err?.message ?? err);
    }
  }

  return item;
}