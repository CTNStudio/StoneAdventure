import { system, EquipmentSlot } from "@minecraft/server";
import { hasBless } from "./seven_curses/index.js";
import { BLESS } from "./seven_curses/bless.js";
const activeRepairZones = new Map();

//玩偶的基础生效范围：以方块中心为原点 ±1.5 格（3x3x3）。祝福 5 生效时这个半边长也 ×2。
const DOLL_ZONE_HALF = 1.5;

function tryRepairItem(item, times = 1) {
    if (!item) return null;
    try {
        const durability = item.getComponent("minecraft:durability");
        if (!durability) return null;
        if (durability.damage <= 0) return null;

        durability.damage = Math.max(0, durability.damage - times);
        return item;
    } catch {
        return null;
    }
}

function repairEntityEquipment(entity, times = 1) {
    try {
        const equippable = entity.getComponent("minecraft:equippable");
        if (!equippable) return;

        const slots = [
            EquipmentSlot.Head,
            EquipmentSlot.Chest,
            EquipmentSlot.Legs,
            EquipmentSlot.Feet,
            EquipmentSlot.Mainhand,
            EquipmentSlot.Offhand
        ];

        for (const slot of slots) {
            try {
                const item = equippable.getEquipment(slot);
                if (!item) continue;
                const repaired = tryRepairItem(item, times);
                if (repaired) {
                    equippable.setEquipment(slot, repaired);
                }
            } catch {
                // 单个槽位失败不影响其他槽位
            }
        }
    } catch {
        // 实体无装备组件则跳过
    }
}

function factorOf(player) {
    try {
        if (hasBless(player, BLESS.doll)) return 2;
    } catch {
    }
    return 1;
}

//玩家右键和红石激活共用：给受益玩家上效果，并登记一个修复区
function activateDoll(block, dimension, players) {
    dimension.playSound("note.pling", block.location, { volume: 1.0, pitch: 1.0 });

    //红石激活时没有具体玩家；修复区倍率取受益者里最高的那个
    let factor = 1;
    for (const player of players) {
        const f = factorOf(player);
        if (f > factor) factor = f;
        player.addEffect("saturation", 2400 * f);
        player.addEffect("regeneration", 2400 * f, { amplifier: 1 });
    }

    activeRepairZones.set(`${block.x},${block.y},${block.z}`, {
        dimension,
        center: {
            x: block.x + 0.5,
            y: block.y + 0.5,
            z: block.z + 0.5
        },
        expiresAt: system.currentTick + 2400 * factor,
        speed: factor,
        //生效范围同样 ×factor
        half: DOLL_ZONE_HALF * factor
    });
}

// 每秒扫描一次所有活跃区域
system.runInterval(() => {
    if (activeRepairZones.size === 0) return;
    const now = system.currentTick;

    for (const [key, zone] of activeRepairZones) {
        // 过期则移除
        if (now >= zone.expiresAt) {
            activeRepairZones.delete(key);
            continue;
        }

        const { dimension, center, speed, half } = zone;
        const reach = half ?? DOLL_ZONE_HALF;

        let entities;
        try {
            entities = dimension.getEntities({
                location: center,
                //球形查询要盖住立方体的角（半边长×√3），取 2 倍半边长
                maxDistance: reach * 2
            });
        } catch {
            continue;
        }

        for (const entity of entities) {
            const loc = entity.location;
            // 精确过滤成立方体范围
            if (Math.abs(loc.x - center.x) <= reach &&
                Math.abs(loc.y - center.y) <= reach &&
                Math.abs(loc.z - center.z) <= reach) {
                repairEntityEquipment(entity, speed ?? 1);
            }
        }
    }
}, 20);

system.beforeEvents.startup.subscribe((event) => {
    event.blockComponentRegistry.registerCustomComponent("stonecraft:doll", {
        onPlayerInteract: ({ player, block, dimension }) => {
            if (!player) return;
            activateDoll(block, dimension, [player]);
        },
        //红石上升沿触发：红石信号 0 → >0 时生效一次，常亮不会重复触发
        onRedstoneUpdate: ({ block, dimension, powerLevel, previousPowerLevel }) => {
            if (powerLevel <= 0 || previousPowerLevel > 0) return;
            //红石激活没有操作者，取方块周围 8 格内的玩家
            activateDoll(block, dimension, dimension.getPlayers({ location: block.center(), maxDistance: 8 }));
        }
    });
});
