import { world } from '@minecraft/server';

function applySandstoneShooterHunger(target, attacker) {
    if (!target || !attacker || attacker.typeId !== 'stonecraft:sandstone_shooter') {
        return;
    }
    target.addEffect('minecraft:hunger', 200, {
        amplifier: 0,
        showParticles: true
    });
}

world.afterEvents.projectileHitEntity.subscribe((event) => {
    const projectile = event.projectile;
    const target = event.hitEntity;
    const owner = projectile?.owner;

    applySandstoneShooterHunger(target, owner);
});

world.afterEvents.entityHurt.subscribe((event) => {
    const target = event.hurtEntity;
    const attacker = event.damageSource?.damagingEntity;

    applySandstoneShooterHunger(target, attacker);
});