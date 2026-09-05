import { world } from "@minecraft/server";

const phaseTwoEntities = new Set();

world.afterEvents.entityHurt.subscribe((event) => {
    const target = event.hurtEntity;

    if (target.typeId === "stonecraft:spire_remnant" && !phaseTwoEntities.has(target.id)) {
        const health = target.getComponent("minecraft:health");

        if (health && health.currentValue <= 90) {
            target.triggerEvent("stonecraft:enter_phase_two");
            phaseTwoEntities.add(target.id);
            target.addEffect("resistance", 999999, { amplifier: 0, showParticles: true });
            target.runCommand("say §5石柱余裔进入狂暴阶段");
        }
    }

    const attacker = event.damageSource?.damagingEntity;

    if (attacker?.typeId !== "stonecraft:spire_remnant") return;
    if (target.typeId !== "minecraft:player") return;

    const dx = attacker.location.x - target.location.x;
    const dy = attacker.location.y - target.location.y;
    const dz = attacker.location.z - target.location.z;
    if (dx * dx + dy * dy + dz * dz > 2.5 * 2.5) return;

    target.addEffect("slowness", 40, { amplifier: 1, showParticles: true });
});
