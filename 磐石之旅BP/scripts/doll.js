import { system, EquipmentSlot } from "@minecraft/server";
import { hasBless } from "./seven_curses/index.js";
const activeRepairZones = new Map();

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

        const { dimension, center, speed } = zone;

        let entities;
        try {
            entities = dimension.getEntities({
                location: center,
                maxDistance: 3
            });
        } catch {
            continue;
        }

        for (const entity of entities) {
            const loc = entity.location;
            // 精确过滤到 3x3x3 立方体范围
            if (Math.abs(loc.x - center.x) <= 1.5 &&
                Math.abs(loc.y - center.y) <= 1.5 &&
                Math.abs(loc.z - center.z) <= 1.5) {
                repairEntityEquipment(entity, speed ?? 1);
            }
        }
    }
}, 20);

system.beforeEvents.startup.subscribe((event) => {
    event.blockComponentRegistry.registerCustomComponent("stonecraft:doll", {
        onPlayerInteract: (event) => {
            const { player, block, dimension } = event;
            const location = block.location;

            dimension.playSound("note.pling", location, { volume: 1.0, pitch: 1.0 });

            //七祝福 6：玩偶效果翻倍（持续时长与修复速度都 ×2）
            let factor = 1;
            try {
                if (hasBless(player, 6)) factor = 2;
            } catch {
            }

            player.addEffect("saturation", 2400 * factor);
            player.addEffect("regeneration", 2400 * factor, { amplifier: 1 });

            const key = `${block.x},${block.y},${block.z}`;
            activeRepairZones.set(key, {
                dimension,
                center: {
                    x: block.x + 0.5,
                    y: block.y + 0.5,
                    z: block.z + 0.5
                },
                expiresAt: system.currentTick + 2400 * factor,
                speed: factor
            });
        }
    });
});