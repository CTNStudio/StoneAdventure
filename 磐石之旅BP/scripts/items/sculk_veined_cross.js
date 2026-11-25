import { world, system, EquipmentSlot, ItemComponentTypes } from "@minecraft/server";
import { hasBless } from "../seven_curses/index.js";
import { BLESS } from "../seven_curses/bless.js";

const ITEM_ID = "stonecraft:sculk_veined_cross";
const SHADE_ID = "stonecraft:pale_martyr_shade";
const SHADE_FADE_TICK = 580;

function spawnShade(player, angle) {
    const location = {
        x: player.location.x + Math.cos(angle) * 1.5,
        y: player.location.y + 0.5,
        z: player.location.z + Math.sin(angle) * 1.5
    };

    const shade = player.dimension.spawnEntity(SHADE_ID, location);
    const tameable = shade.getComponent("minecraft:tameable");
    if (tameable) tameable.tame(player);

    player.dimension.spawnParticle("stonecraft:abyss_soul", location);

    system.runTimeout(() => {
        if (!shade.isValid) return;
        try {
            shade.dimension.spawnParticle("stonecraft:abyss_soul", shade.location);
        }
        catch (e) {
        }
        shade.dimension.playSound("mob.warden.heartbeat", shade.location);
    }, SHADE_FADE_TICK);
}

world.afterEvents.itemCompleteUse.subscribe((event) => {
    const player = event.source;
    if (!player || event.itemStack?.typeId !== ITEM_ID) return;

    const equippable = player.getComponent("equippable");
    if (!equippable) return;

    const item = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (!item || item.typeId !== ITEM_ID) return;

    const count = hasBless(player, BLESS.doll) ? 7 : 4;
    for (let i = 0; i < count; i++) {
        spawnShade(player, (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3);
    }
    player.dimension.playSound("shriek.sculk_shrieker", player.location);

    const durability = item.getComponent(ItemComponentTypes.Durability);
    if (!durability) return;

    const nextDamage = durability.damage + 7;
    if (nextDamage >= durability.maxDurability) {
        equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
        system.run(() => {
            player.playSound("random.break");
        });
        return;
    }

    durability.damage = nextDamage;
    equippable.setEquipment(EquipmentSlot.Mainhand, item);
});

world.beforeEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity;
    const attacker = event.damageSource?.damagingEntity;
    if (victim?.typeId !== "minecraft:player") return;
    if (attacker?.typeId !== SHADE_ID) return;
    event.cancel = true;
});
