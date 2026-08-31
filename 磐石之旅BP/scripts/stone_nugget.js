import { world, system } from "@minecraft/server";
const STOP_SOUND_BALLS = [
    "stonecraft:thrown_stone_nugget",
];

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (!entity) return;

    if (STOP_SOUND_BALLS.includes(entity.typeId)) {
        let ticks = 0;

        const intervalId = system.runInterval(() => {
            if (!entity.isValid || ticks >= 20) {
                system.clearRun(intervalId);
                return;
            }

            try {
                entity.runCommand("stopsound @p random.bow");
            } catch (e) {}

            ticks++;
        }, 1);
    }
});

const ballEffects = {
    
    "stonecraft:thrown_stone_nugget": {
        sound: "dig.stone",
        volume: 30,
        pitch: 0.8,
        particle: "stonecraft:thrown_stone_nugget_destruct"
    }
};

const removedProjectiles = new Set();

function safeRemoveProjectile(entity) {

    if (!entity) return;

    const id = entity.id;

    if (removedProjectiles.has(id)) return;

    removedProjectiles.add(id);


    try {

        if (entity.isValid) {
            entity.remove();
        }

    } catch (e) {}


    system.runTimeout(() => {
        removedProjectiles.delete(id);
    }, 40);
}


function handleBallHit(dimension, location, typeId) {

    const data = ballEffects[typeId];

    if (!data) return;


    try {

        dimension.playSound(
            data.sound,
            location,
            {
                volume: data.volume,
                pitch: data.pitch
            }
        );

    } catch (e) {}


    try {

        dimension.spawnParticle(
            data.particle,
            location
        );

    } catch (e) {}

}


function isBall(typeId) {

    return ballEffects[typeId] !== undefined;

}

world.afterEvents.projectileHitEntity.subscribe((event)=>{


    const projectile = event.projectile;


    if (!projectile || !projectile.isValid) return;


    const typeId = projectile.typeId;


    if (!isBall(typeId)) return;


    handleBallHit(
        event.dimension,
        event.location,
        typeId
    );


    const data = ballEffects[typeId];


    if (!data.noRemove) {

        safeRemoveProjectile(projectile);

    }


});


world.afterEvents.projectileHitBlock.subscribe((event)=>{


    const projectile = event.projectile;


    if (!projectile || !projectile.isValid) return;


    const typeId = projectile.typeId;


    if (!isBall(typeId)) return;


    handleBallHit(
        event.dimension,
        event.location,
        typeId
    );


    const data = ballEffects[typeId];


    if (!data.noRemove) {

        safeRemoveProjectile(projectile);

    }


});