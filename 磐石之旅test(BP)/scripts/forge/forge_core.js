import {
  BlockPermutation,
  system,
  world,
} from "@minecraft/server";

import {
  ATTRIBUTE_DEFS,
  createItem,
  extractTagSuffix,
  giveItem,
  getMainHandItem,
  getOrZero,
  setMainHandItem,
  setOrClearDynamicProperty,
} from "./forge_utils.js";

const BLOCK_ID = "stonecraft:stone_smithing_table";
const STATE_FILLED = "stonecraft:filled_item";
const PROP_STORED_TYPE = "stonecraft:stored_type";
const PROP_STORED_DATA = "stonecraft:stored_data";
const PROP_STORED_ITEM_ID = "stonecraft:stored_item_id";
const PROP_EXPANSION_TIMES = "stonecraft:expansion_times";
const WEAPON_SUFFIXES = ["sword", "axe", "pickaxe", "shovel", "hoe", "spear", "hammer", "versatile"];
const ARMOR_SUFFIXES = ["helmets", "chestplates", "leggings", "boots"];

const EQUIP_SUFFIXES = [
  "helmets",
  "chestplates",
  "leggings",
  "boots",
  "sword",
  "axe",
  "pickaxe",
  "shovel",
  "hoe",
  "shield",
  "spear",
  "hammer",
];

const BLOCK_CACHE = new Map();

// ========== 工具函数 ==========
function getBlockCacheKey(block) {
  try {
    const location = block.location;
    const dimId = block.dimension?.id ?? block.dimension?.name ?? "unknown";
    return `${dimId}:${location.x}:${location.y}:${location.z}`;
  } catch {
    return "unknown_block";
  }
}

function blockSupportsDynamicProperties(block) {
  return typeof block?.setDynamicProperty === "function" && typeof block?.getDynamicProperty === "function";
}

function writeBlockDynamicProperty(block, key, value) {
  if (!blockSupportsDynamicProperties(block)) return false;
  try {
    block.setDynamicProperty(key, value);
    return true;
  } catch {
    return false;
  }
}

function sendFeedback(player, key) {
  const msg = { translate: key };
  try {
    player.onScreenDisplay?.setActionBar(msg);
  } catch {
    try {
      player.sendMessage(msg);
    } catch {
    }
  }
}

function playForgeSuccessSound(player) {
  try {
    player?.playSound?.("smithing_table.use");
  } catch {
  }
}

function playPlaceWeaponSound(player) {
  try {
    player?.playSound?.("block.decorated_pot.insert");
  } catch {
  }
}

function getItemTags(item) {
  try {
    return item?.getTags?.() ?? [];
  } catch {
    return [];
  }
}

function findForgeType(item) {
  for (const tag of getItemTags(item)) {
    if (tag.startsWith("forge_")) {
      return extractTagSuffix(tag, "forge");
    }
  }
  return "";
}

function parseScopedAttributePayload(payload, fallbackEquipType) {
  const directMatch = ATTRIBUTE_DEFS.find((def) => def.id === payload);
  if (directMatch) {
    return {
      attributeId: directMatch.id,
      equipType: fallbackEquipType,
    };
  }

  for (const def of ATTRIBUTE_DEFS) {
    const hit = `${def.id}_`;
    if (payload.startsWith(hit)) {
      const suffix = payload.slice(hit.length);
      if (EQUIP_SUFFIXES.includes(suffix)) {
        return {
          attributeId: def.id,
          equipType: suffix,
        };
      }
    }
  }

  return null;
}

function findBeadInfo(item) {
  const tags = getItemTags(item);
  const typeId = item?.typeId ?? "";

  for (const tag of tags) {
    if (!tag.startsWith("inlaid_essence_bead_")) continue;
    const body = tag.slice("inlaid_essence_bead_".length);
    if (!body) continue;

    if (body.startsWith("weapon_")) {
      const payload = body.slice("weapon_".length);
      const parsed = parseScopedAttributePayload(payload, "__WEAPON__");
      if (parsed) {
        return {
          attributeId: parsed.attributeId,
          equipType: parsed.equipType,
          tag,
        };
      }
      continue;
    }

    if (body.startsWith("armor_")) {
      const payload = body.slice("armor_".length);
      const parsed = parseScopedAttributePayload(payload, "__ARMOR__");
      if (parsed) {
        return {
          attributeId: parsed.attributeId,
          equipType: parsed.equipType,
          tag,
        };
      }
      continue;
    }

    // 原有逻辑：检查是否纯装备标签（如 sword）
    const isEquipTag = EQUIP_SUFFIXES.includes(body);
    if (isEquipTag) continue;

    // 原有逻辑：匹配 <属性ID>_<装备类型>
    for (const suffix of EQUIP_SUFFIXES) {
      const hit = `_${suffix}`;
      if (body.endsWith(hit)) {
        return {
          attributeId: body.slice(0, -hit.length),
          equipType: suffix,
          tag,
        };
      }
    }

    // 原有逻辑：纯属性 ID（全通用）
    const directMatch = ATTRIBUTE_DEFS.find((def) => def.id === body);
    if (directMatch) {
      return {
        attributeId: body,
        equipType: "",            // 空字符串 = 全通用
        tag,
      };
    }
  }
  for (const def of ATTRIBUTE_DEFS) {
    if (typeId.includes(def.id)) {
      return {
        attributeId: def.id,
        equipType: "",
        tag: "",
      };
    }
  }
  return null;
}

function getWeaponCategory(item) {
  const forgeType = findForgeType(item);
  return forgeType || "";
}

function isExpansionSlab(item) {
  return item?.typeId === "stonecraft:expansion_slab";
}

function isBead(item) {
  return !!findBeadInfo(item);
}

function isBaseItem(item) {
  return isBead(item) || isExpansionSlab(item);
}

function hasAnyAttributeLevel(item) {
  for (const def of ATTRIBUTE_DEFS) {
    if (getOrZero(item, def.key, 0) > 0) return true;
  }
  return false;
}

function getExpansionTimes(item) {
  return getOrZero(item, PROP_EXPANSION_TIMES, 0);
}

function isForgedWeapon(item) {
  return !!item && hasAnyAttributeLevel(item);
}

function isValidForgeMaterial(item) {
  return !!findForgeType(item);
}

function countUsedSlots(item) {
  let total = 0;
  for (const def of ATTRIBUTE_DEFS) {
    total += getOrZero(item, def.key, 0);
  }
  return total;
}

function getMaxSlots(item) {
  return 3 + Math.min(getExpansionTimes(item), 3) * 2;
}

function isPrimitiveDynamicValue(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function readDynamicMap(target) {
  const out = {};
  try {
    const ids = target?.getDynamicPropertyIds?.() ?? [];
    for (const id of ids) {
      const value = target.getDynamicProperty(id);
      if (isPrimitiveDynamicValue(value)) {
        out[id] = value;
      }
    }
    return out;
  } catch {
    // fallback
  }
  for (const def of ATTRIBUTE_DEFS) {
    out[def.key] = getOrZero(target, def.key, 0);
  }
  out[PROP_EXPANSION_TIMES] = getOrZero(target, PROP_EXPANSION_TIMES, 0);
  return out;
}

function serializeItem(item) {
  if (!item) return "";
  const data = {
    typeId: item.typeId,
    amount: 1,
    lore: [],
    dynamic: readDynamicMap(item),
  };
  try {
    data.lore = item.getLore?.() ?? [];
  } catch {
    data.lore = [];
  }
  return JSON.stringify(data);
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function applyStoredDataToItem(item, data) {
  if (!item || !data || typeof data !== "object") return;
  try {
    if (Array.isArray(data.lore) && data.lore.length > 0) {
      item.setLore(data.lore);
    }
  } catch {
    /* ignore */
  }
  try {
    const dynamic = data.dynamic ?? {};
    for (const [key, value] of Object.entries(dynamic)) {
      if (!isPrimitiveDynamicValue(value)) continue;
      try {
        item.setDynamicProperty(key, value);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

function deserializeItem(dataText) {
  if (!dataText) return undefined;
  const data = tryParseJson(dataText);
  if (!data || typeof data !== "object") return undefined;
  if (!data.typeId || typeof data.typeId !== "string") return undefined;
  const item = createItem(data.typeId, 1);
  if (!item) return undefined;
  applyStoredDataToItem(item, data);
  rebuildLore(item);
  return item;
}

function normalizeStoredValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function getStoredType(block) {
  const blockKey = getBlockCacheKey(block);
  const cached = BLOCK_CACHE.get(blockKey);
  if (blockSupportsDynamicProperties(block)) {
    try {
      const value = normalizeStoredValue(block.getDynamicProperty(PROP_STORED_TYPE));
      if (isStoredTypeValid(value)) return value;
    } catch {
      /* ignore */
    }
  }
  return cached && isStoredTypeValid(cached.type) ? cached.type : "";
}

function setStoredType(block, value) {
  return writeBlockDynamicProperty(block, PROP_STORED_TYPE, value || "");
}

function getStoredData(block) {
  const blockKey = getBlockCacheKey(block);
  const cached = BLOCK_CACHE.get(blockKey);
  if (blockSupportsDynamicProperties(block)) {
    try {
      return normalizeStoredValue(block.getDynamicProperty(PROP_STORED_DATA));
    } catch {
      return cached?.data ?? "";
    }
  }
  return cached?.data ?? "";
}

function setStoredData(block, value) {
  return writeBlockDynamicProperty(block, PROP_STORED_DATA, value || "");
}

function setStoredItemId(block, value) {
  return writeBlockDynamicProperty(block, PROP_STORED_ITEM_ID, value || "");
}

function getStoredItemId(block) {
  const blockKey = getBlockCacheKey(block);
  const cached = BLOCK_CACHE.get(blockKey);
  if (blockSupportsDynamicProperties(block)) {
    try {
      return normalizeStoredValue(block.getDynamicProperty(PROP_STORED_ITEM_ID));
    } catch {
      return cached?.itemId ?? "";
    }
  }
  return cached?.itemId ?? "";
}

function setBlockFilled(block, filled) {
  try {
    const permutation = block.permutation.withState(STATE_FILLED, !!filled);
    block.setPermutation(permutation);
    return true;
  } catch {
    try {
      const current = BlockPermutation.resolve(block.typeId, {
        [STATE_FILLED]: !!filled,
      });
      block.setPermutation(current);
      return true;
    } catch {
      return false;
    }
  }
}

function getBlockFilled(block) {
  try {
    return !!block.permutation.getState(STATE_FILLED);
  } catch {
    return false;
  }
}

function consumeHeldItem(player, heldItem) {
  if (!heldItem) return;
  try {
    if (heldItem.amount > 1) {
      heldItem.amount -= 1;
      setMainHandItem(player, heldItem);
    } else {
      setMainHandItem(player, undefined);
    }
  } catch {
    try {
      setMainHandItem(player, undefined);
    } catch {
      /* ignore */
    }
  }
}

function isStoredTypeValid(type) {
  return type === "weapon" || type === "armor" || type === "bead" || type === "slab";
}

function inferStoredType(item) {
  if (!item) return "";
  if (isExpansionSlab(item)) return "slab";
  if (isBead(item)) return "bead";
  if (isValidForgeMaterial(item) || isForgedWeapon(item)) {
    const forgeType = findForgeType(item);
    if (ARMOR_SUFFIXES.includes(forgeType)) return "armor";
    if (WEAPON_SUFFIXES.includes(forgeType)) return "weapon";
    return "weapon";
  }
  return "";
}

function storeItemInBlock(block, item, type) {
  const blockKey = getBlockCacheKey(block);
  const dataText = serializeItem(item);
  const typeId = item?.typeId ?? "";
  const supportsDynamic = blockSupportsDynamicProperties(block);

  let typeOk = true, idOk = true, dataOk = true;
  if (supportsDynamic) {
    typeOk = setStoredType(block, type);
    idOk = setStoredItemId(block, typeId);
    dataOk = setStoredData(block, dataText);
  }
  if (supportsDynamic && (!typeOk || !idOk || !dataOk)) {
    console.warn("[Stonecraft] Forge table dynamic property write failed, using cache fallback: " + JSON.stringify({
      type, typeId, dataLength: dataText.length, typeOk, idOk, dataOk,
      blockLocation: block.location, blockType: block.typeId,
    }));
  }

  BLOCK_CACHE.set(blockKey, { type, itemId: typeId, data: dataText });

  const okState = setBlockFilled(block, true);
  if (!okState) {
    console.error("[Stonecraft] Failed to set forge table filled state", {
      blockLocation: block.location, blockType: block.typeId,
    });
    clearBlockStorage(block);
    return false;
  }
  return true;
}

function clearBlockStorage(block) {
  const blockKey = getBlockCacheKey(block);
  BLOCK_CACHE.delete(blockKey);
  if (blockSupportsDynamicProperties(block)) {
    try { setStoredType(block, ""); } catch {}
    try { setStoredItemId(block, ""); } catch {}
    try { setStoredData(block, ""); } catch {}
  }
  try { setBlockFilled(block, false); } catch {}
}

function loadItemFromBlock(block) {
  const blockKey = getBlockCacheKey(block);
  const cached = BLOCK_CACHE.get(blockKey);
  const dataText = getStoredData(block);
  const data = dataText ? tryParseJson(dataText) : null;

  if (dataText) {
    const item = deserializeItem(dataText);
    if (item) return item;
  }

  const typeId = getStoredItemId(block) || (data?.typeId ?? "");
  if (typeId) {
    const item = createItem(typeId, 1);
    if (item) {
      applyStoredDataToItem(item, data);
      rebuildLore(item);
      return item;
    }
  }

  if (cached) {
    try {
      const item = createItem(cached.itemId, 1);
      if (item) {
        const cachedData = cached.data ? tryParseJson(cached.data) : null;
        applyStoredDataToItem(item, cachedData);
        rebuildLore(item);
        return item;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    console.warn("[Stonecraft] loadItemFromBlock failed", JSON.stringify({
      storedData: dataText, storedItemId: typeId, cachedItem: cached?.itemId,
      blockLocation: block.location, blockType: block.typeId,
    }));
  } catch {
    console.warn("[Stonecraft] loadItemFromBlock failed", "unable to stringify debug info");
  }

  clearBlockStorage(block);
  BLOCK_CACHE.delete(blockKey);
  return undefined;
}

function refundAll(player, items) {
  for (const item of items) {
    if (!item) continue;
    giveItem(player, item);
  }
}

// ========== 核心 Lore 重建函数 ==========
function rebuildLore(item) {
  if (!item) return;
  const lore = [];

  for (const def of ATTRIBUTE_DEFS) {
    const level = getOrZero(item, def.key, 0);
    if (level > 0) {
      lore.push(`${def.loreText} §7Lv.${level}`);
    }
  }

  const used = countUsedSlots(item);
  const max = getMaxSlots(item);
  lore.push(`§6空位: §7${used}/${max}`);

  try {
    item.setLore(lore);
  } catch {
    /* ignore */
  }
}

// ========== 锻造操作函数 ==========
export function applyBeadToWeapon(player, weapon, beadItem) {
  const beadInfo = findBeadInfo(beadItem);
  if (!beadInfo) {
    return { ok: false, reason: "stonecraft.error.invalid_bead" };
  }

  const def = ATTRIBUTE_DEFS.find((entry) => entry.id === beadInfo.attributeId);
  if (!def) {
    return { ok: false, reason: "stonecraft.error.unknown_attribute" };
  }

  const weaponType = getWeaponCategory(weapon);
  if (!weaponType) {
    return { ok: false, reason: "stonecraft.error.invalid_material" };
  }

  // ========== 统一类型匹配检查 ==========
  if (beadInfo.equipType) {
    if (beadInfo.equipType === "__WEAPON__") {
      if (!WEAPON_SUFFIXES.includes(weaponType)) {
        return { ok: false, reason: "stonecraft.error.type_mismatch" };
      }
    } else if (beadInfo.equipType === "__ARMOR__") {
      if (!ARMOR_SUFFIXES.includes(weaponType)) {
        return { ok: false, reason: "stonecraft.error.type_mismatch" };
      }
    } else {
      // 指定了具体装备类型（如 "sword"）
      if (beadInfo.equipType !== weaponType) {
        return { ok: false, reason: "stonecraft.error.type_mismatch" };
      }
    }
  }
  const currentLevel = getOrZero(weapon, def.key, 0);
  if (currentLevel >= 3) {
    try { player.addExperience(5); } catch {}
    return { ok: false, reason: "stonecraft.error.attribute_maxed" };
  }

  const usedSlots = countUsedSlots(weapon);
  const maxSlots = getMaxSlots(weapon);
  if (usedSlots >= maxSlots) {
    return { ok: false, reason: "stonecraft.error.no_free_slot" };
  }

  const nextLevel = currentLevel + 1;
  try {
    weapon.setDynamicProperty(def.key, nextLevel);
  } catch {
    return { ok: false, reason: "stonecraft.error.write_failed" };
  }

  rebuildLore(weapon);
  return { ok: true, item: weapon };
}

export function applyExpansionToWeapon(player, weapon) {
  const times = getExpansionTimes(weapon);
  if (times >= 3) {
    try { player.addExperience(5); } catch {}
    return { ok: false, reason: "stonecraft.error.expansion_maxed" };
  }

  const nextTimes = times + 1;
  try {
    weapon.setDynamicProperty(PROP_EXPANSION_TIMES, nextTimes);
  } catch {
    return { ok: false, reason: "stonecraft.error.write_failed" };
  }

  rebuildLore(weapon);
  return { ok: true, item: weapon };
}

function onTakeOut(player, block) {
  const item = loadItemFromBlock(block);
  if (!item) {
    sendFeedback(player, "stonecraft.error.no_item");
    clearBlockStorage(block);
    return;
  }
  clearBlockStorage(block);
  const success = setMainHandItem(player, item);
  if (!success) {
    giveItem(player, item);
  }
  sendFeedback(player, "stonecraft.forge.take_out");
}

function onPlaceWeapon(player, block, item) {
  if (!isValidForgeMaterial(item) && !isForgedWeapon(item)) {
    sendFeedback(player, "stonecraft.error.place_weapon_first");
    return;
  }

  const preserved = item;
  const storedType = inferStoredType(preserved) || "weapon";
  setMainHandItem(player, undefined);
  const stored = storeItemInBlock(block, preserved, storedType);
  if (!stored) {
    giveItem(player, preserved);
    sendFeedback(player, "stonecraft.error.store_failed");
    return;
  }
  // 播放放入武器音效（独立于锻造成功音效）
  playPlaceWeaponSound(player);
  sendFeedback(player, "stonecraft.forge.weapon_stored");
}

function onApplyMaterial(player, block, heldItem) {
  let storedType = getStoredType(block);
  const storedItem = loadItemFromBlock(block);
  if (!storedItem) {
    clearBlockStorage(block);
    sendFeedback(player, "stonecraft.error.no_item");
    return;
  }

  if (!isStoredTypeValid(storedType)) {
    const inferredType = inferStoredType(storedItem);
    if (isStoredTypeValid(inferredType)) {
      storedType = inferredType;
      try { setStoredType(block, inferredType); } catch {}
    }
  }

  if (!isStoredTypeValid(storedType)) {
    clearBlockStorage(block);
    sendFeedback(player, "stonecraft.error.invalid_state");
    return;
  }

  if (storedType === "weapon" || storedType === "armor") {
    if (!isBaseItem(heldItem)) {
      if (isValidForgeMaterial(heldItem) || isForgedWeapon(heldItem)) {
        sendFeedback(player, storedType === "armor" ? "stonecraft.error.already_has_weapon" : "stonecraft.error.already_has_weapon");
        return;
      }
      sendFeedback(player, "stonecraft.error.invalid_base");
      return;
    }

    const result = isExpansionSlab(heldItem)
      ? applyExpansionToWeapon(player, storedItem)
      : applyBeadToWeapon(player, storedItem, heldItem);

    if (!result.ok) {
      giveItem(player, storedItem);
      clearBlockStorage(block);
      sendFeedback(player, result.reason);
      return;
    }

    consumeHeldItem(player, heldItem);
    clearBlockStorage(block);
    const returned = setMainHandItem(player, result.item);
    if (!returned) {
      giveItem(player, result.item);
    }
    playForgeSuccessSound(player);
    sendFeedback(player, isExpansionSlab(heldItem) ? "stonecraft.forge.completed_expansion" : "stonecraft.forge.completed_socket");
    return;
  }

  if (storedType === "bead" || storedType === "slab") {
    if (!isValidForgeMaterial(heldItem) && !isForgedWeapon(heldItem)) {
      sendFeedback(player, "stonecraft.error.invalid_weapon");
      return;
    }

    const result = storedType === "slab"
      ? applyExpansionToWeapon(player, heldItem)
      : applyBeadToWeapon(player, heldItem, storedItem);

    if (!result.ok) {
      giveItem(player, storedItem);
      clearBlockStorage(block);
      sendFeedback(player, result.reason);
      return;
    }

    clearBlockStorage(block);
    setMainHandItem(player, undefined);
    const returned = setMainHandItem(player, result.item);
    if (!returned) {
      giveItem(player, result.item);
    }
    playForgeSuccessSound(player);
    sendFeedback(player, storedType === "slab" ? "stonecraft.forge.completed_expansion" : "stonecraft.forge.completed_socket");
    return;
  }

  sendFeedback(player, "stonecraft.error.invalid_state");
}

function interactWithTable(event) {
  const player = event.player;
  const block = event.block;
  const heldItem = event.itemStack ?? getMainHandItem(player);

  try { event.cancel = true; } catch {}

  if (!block || block.typeId !== BLOCK_ID) return;

  if (!getBlockFilled(block)) {
    if (!heldItem) {
      sendFeedback(player, "stonecraft.error.need_item");
      return;
    }
    if (isBaseItem(heldItem)) {
      sendFeedback(player, "stonecraft.error.place_weapon_first");
      return;
    }
    onPlaceWeapon(player, block, heldItem);
    return;
  }

  if (!heldItem) {
    onTakeOut(player, block);
    return;
  }

  onApplyMaterial(player, block, heldItem);
}

export function initForgeCore() {
  const register = (event) => {
    try {
      if (!event || !event.blockComponentRegistry) {
        console.error("[Stonecraft] blockComponentRegistry is unavailable");
        return;
      }
      event.blockComponentRegistry.registerCustomComponent(
        "stonecraft:stone_smithing_table",
        { onPlayerInteract: interactWithTable }
      );
    } catch (error) {
      console.error("[Stonecraft] forge core registration failed:", error);
    }
  };

  try {
    if (system.beforeEvents && system.beforeEvents.startup && system.beforeEvents.startup.subscribe) {
      system.beforeEvents.startup.subscribe(register);
      return;
    }
  } catch (error) {
    console.error("[Stonecraft] system startup hook failed:", error);
  }

  try {
    if (world.beforeEvents && world.beforeEvents.worldInitialize && world.beforeEvents.worldInitialize.subscribe) {
      world.beforeEvents.worldInitialize.subscribe(register);
      return;
    }
  } catch (error) {
    console.error("[Stonecraft] worldInitialize hook failed:", error);
  }

  console.error("[Stonecraft] no valid initialization event found for custom block registration");
}