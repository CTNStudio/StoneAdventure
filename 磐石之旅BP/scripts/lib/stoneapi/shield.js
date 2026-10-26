//StoneAPI —— 盾牌格挡库
//用法（可分散在多个脚本，组件名自定）：
//    const shields = new ShieldRegistry();
//    shields.addComponent("stonecraft:shield");
//    shields.register();
//物品侧声明（thorns 可省略，省略即不反伤）：
//    "stonecraft:shield": { "thorns": 4 }
import { world, system, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";
//不填 thorns 时的反伤值
const DEFAULT_THORNS = 0;
//格挡成功的基础耐久消耗（另加 伤害/2）
const BASE_DURABILITY_COST = 1;
//可被格挡的伤害类型
//未列入的 magic（守卫者激光/龙息/状态效果）、sonicBoom（监守者）、fall（摔落）、fire 等都会被拒绝
const BLOCKABLE_CAUSES = new Set([
	"entityAttack",    //近战
	"mobAttack",       //生物近战
	"projectile",      //箭/三叉戟/雪球/鸡蛋/潜影贝/火球/羊驼唾沫/河豚刺
	"entityExplosion", //苦力怕、恶魂火球、TNT、水晶等
	"blockExplosion",  //床、重生锚
	"contact",         //河豚、甜浆果等接触伤害
	"ramAttack",       //劫掠兽冲撞
	"charging",        //冲撞类
]);
//近战攻击后直接禁用盾牌的生物
const DISABLE_FOR_MELEE_MOBS = new Set([
	"minecraft:warden"
]);
//已注册的盾牌组件名
const shieldComponents = new Set();
//entityId -> 可格挡截止 tick（攻击/使用物品中）
const busyUntil = new Map();
//entityId -> 禁用截止 tick
const disableUntil = new Map();
let subscribed = false;
const nowTick = () => system.currentTick;

//判断攻击者是否在实体正前方
export function AttackerInFront(entity, attacker, threshold = 0) {
	try {
		const view = entity.getViewDirection();
		const from = entity.getHeadLocation();
		const to = attacker.getHeadLocation();
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const dz = to.z - from.z;
		const len = Math.hypot(dx, dy, dz) || 1;
		const dot = (dx / len) * view.x + (dy / len) * view.y + (dz / len) * view.z;
		return dot > threshold;
	} catch {
		return false;
	}
}
function markBusy(entity, ticks = 10) {
	try {
		if (!entity?.isValid) return;
		busyUntil.set(entity.id, nowTick() + ticks);
	} catch {
	}
}
//正在使用物品的玩家 id（由 itemStartUse / itemStopUse 维护，不依赖使用时长）
const usingItem = new Set();
function startUsing(entity) {
	try {
		if (!entity?.isValid) return;
		usingItem.add(entity.id);
	} catch {
	}
}
function stopUsing(entity) {
	try {
		if (!entity) return;
		usingItem.delete(entity.id);
	} catch {
	}
}
function isBusy(entity) {
	try {
		//正在使用物品（按开始/结束事件追踪，与使用时长无关）
		if (usingItem.has(entity.id)) return true;
		const until = busyUntil.get(entity.id);
		if (until === undefined) return false;
		if (nowTick() > until) {
			busyUntil.delete(entity.id);
			return false;
		}
		return true;
	} catch {
		return false;
	}
}
function isDisabled(entity) {
	try {
		const until = disableUntil.get(entity.id);
		if (until === undefined) return false;
		if (nowTick() > until) {
			disableUntil.delete(entity.id);
			return false;
		}
		return true;
	} catch {
		return false;
	}
}
//取玩家手持的盾牌（主手优先，其次副手）
function getShield(player) {
	try {
		const equippable = player.getComponent(EntityComponentTypes.Equippable);
		if (!equippable) return undefined;
		for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]) {
			const item = equippable.getEquipment(slot);
			if (!item) continue;
			for (const id of shieldComponents) {
				const component = item.getComponent(id);
				if (!component) continue;
				const params = component.customComponentParameters?.params ?? {};
				return { item, slot, componentId: id, params };
			}
		}
	} catch {
	}
	return undefined;
}
//核心判定：能否格挡本次伤害（所有条件收敛在这里）
export function canBlock(player, event) {
	try {
		if (!player?.isValid) return false;
		if (player.typeId !== "minecraft:player") return false;
		const source = event?.damageSource;
		if (!source) return false;
		//蹲下举盾
		if (!player.isSneaking) return false;
		//禁用冷却中
		if (isDisabled(player)) return false;
		//正在攻击或使用物品
		if (isBusy(player)) return false;
		//伤害类型必须可格挡
		if (!BLOCKABLE_CAUSES.has(source.cause)) return false;
		//攻击者必须在正前方
		const attacker = source.damagingEntity;
		if (attacker && !AttackerInFront(player, attacker, 0)) return false;
		//必须手持盾牌
		if (!getShield(player)) return false;
		return true;
	} catch {
		return false;
	}
}
function damageShield(player, shield, amount) {
	try {
		const durability = shield.item.getComponent("minecraft:durability");
		if (!durability) return;
		if (durability.damage >= durability.maxDurability) return;
		durability.damage = Math.min(durability.maxDurability, durability.damage + amount);
		const equippable = player.getComponent(EntityComponentTypes.Equippable);
		equippable?.setEquipment(shield.slot, shield.item);
	} catch {
	}
}
function knockbackAttacker(player, attacker) {
	try {
		const from = player.getHeadLocation();
		const to = attacker.getHeadLocation();
		const dx = to.x - from.x;
		const dz = to.z - from.z;
		const dist = Math.hypot(dx, dz) || 1;
		attacker.applyKnockback(
			{ x: (dx / dist) * 1.6, z: (dz / dist) * 1.6 },
			0.45
		);
	} catch {
	}
}
function holdsAxe(entity) {
	try {
		const item = entity
			.getComponent(EntityComponentTypes.Equippable)
			?.getEquipment(EquipmentSlot.Mainhand);
		return item ? item.hasTag("minecraft:is_axe") : false;
	} catch {
		return false;
	}
}
//是否需要禁用盾牌：持斧生物的近战、监守者的近战
function shouldDisableShield(attacker, cause) {
	if (!attacker) return false;
	if (cause !== "entityAttack" && cause !== "mobAttack") return false;
	if (DISABLE_FOR_MELEE_MOBS.has(attacker.typeId)) return true;
	return holdsAxe(attacker);
}
function disableShield(player, shield) {
	try {
		disableUntil.set(player.id, nowTick() + 100);
		player.playSound("random.break");
		//同步物品自身冷却，让快捷栏有冷却显示
		const cooldown = shield.item.getComponent("minecraft:cooldown");
		if (cooldown) cooldown.startCooldown(player);
	} catch {
	}
}
//反伤值来自组件参数 thorns，未填则用默认值
function readThorns(shield) {
	const value = Number(shield?.params?.thorns);
	return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : DEFAULT_THORNS;
}
function subscribeOnce() {
	if (subscribed) return;
	subscribed = true;
	//攻击中：挥手即标记
	world.afterEvents.playerSwingStart.subscribe(({ player }) => {
		if (player) markBusy(player);
	});
	//攻击中：命中实体再标记一次
	world.afterEvents.entityHitEntity.subscribe(({ damagingEntity }) => {
		if (damagingEntity?.typeId === "minecraft:player") markBusy(damagingEntity);
	});
	//使用物品中：按开始/结束事件追踪，吃长时长食物期间同样无法格挡
	world.afterEvents.itemStartUse.subscribe(({ source }) => {
		if (source?.typeId === "minecraft:player") startUsing(source);
	});
	world.afterEvents.itemStopUse.subscribe(({ source }) => {
		if (source?.typeId === "minecraft:player") {
			stopUsing(source);
			markBusy(source, 4);
		}
	});
	world.afterEvents.itemCompleteUse.subscribe(({ source }) => {
		if (source?.typeId === "minecraft:player") {
			stopUsing(source);
			markBusy(source, 4);
		}
	});
	//切换快捷栏 / 上线 / 离开：清掉使用状态，避免卡在"使用中"
	world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({ player }) => {
		if (player) stopUsing(player);
	});
	world.afterEvents.playerSpawn.subscribe(({ player }) => {
		if (player) stopUsing(player);
	});
	world.afterEvents.playerLeave.subscribe(({ playerId }) => {
		if (playerId) usingItem.delete(playerId);
	});
	//对方块交互后短时间同样不允许格挡
	world.afterEvents.playerInteractWithBlock.subscribe(({ player }) => {
		if (player) markBusy(player);
	});
	//格挡主逻辑
	world.beforeEvents.entityHurt.subscribe((event) => {
		const player = event.hurtEntity;
		if (!player || player.typeId !== "minecraft:player") return;
		if (!canBlock(player, event)) return;
		const shield = getShield(player);
		if (!shield) return;
		event.cancel = true;
		const attacker = event.damageSource?.damagingEntity;
		const cause = event.damageSource?.cause;
		const damage = Number(event.damage) || 0;
		const thorns = readThorns(shield);
		const disable = shouldDisableShield(attacker, cause);
		system.run(() => {
			if (!player.isValid) return;
			try {
				player.playSound("item.shield.block");
			} catch {
			}
			damageShield(player, shield, BASE_DURABILITY_COST + Math.floor(damage / 2));
			if (attacker?.isValid) {
				knockbackAttacker(player, attacker);
				if (thorns > 0) {
					try {
						attacker.applyDamage(thorns, { cause: "thorns", damagingEntity: player });
					} catch {
					}
				}
			}
			if (disable) disableShield(player, shield);
		});
	});
}
export class ShieldRegistry {
	constructor() {
		this.registered = false;
	}
	//注册一个盾牌组件名，物品声明该组件即被视为盾牌
	addComponent(componentId) {
		if (typeof componentId === "string" && componentId) shieldComponents.add(componentId);
		return this;
	}
	register() {
		if (this.registered) return this;
		this.registered = true;
		const ids = [...shieldComponents];
		if (ids.length > 0) {
			try {
				system.beforeEvents.startup.subscribe((event) => {
					const registry = event?.itemComponentRegistry;
					if (!registry) return;
					for (const id of ids) {
						try {
							registry.registerCustomComponent(id, {});
						} catch (error) {
							console.error(`[StoneAPI] register shield component ${id} failed:`, error);
						}
					}
				});
			} catch (error) {
				console.error("[StoneAPI] shield startup hook failed:", error);
			}
		}
		subscribeOnce();
		return this;
	}
}
//查询某玩家当前是否处于盾牌禁用中
export function isShieldDisabled(player) {
	return isDisabled(player);
}
//已注册的盾牌组件名
export function getShieldComponents() {
	return [...shieldComponents];
}