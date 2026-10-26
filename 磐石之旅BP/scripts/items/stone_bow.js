//by 星云
/*import { world, EasingType, Player } from "@minecraft/server";
const BOW_ITEM_ID = "stonecraft:stone_bow";
const TARGET_FOV_RATIO = 10;
const BASE_FOV = 6;
const EASE_TIME = 0.5;

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;
    if (!player || item?.typeId !== BOW_ITEM_ID) return;
    const targetFov = BASE_FOV * TARGET_FOV_RATIO;
    try {
        player.camera.setFov({
            fov: targetFov,
            easeOptions: {
                easeTime: EASE_TIME,
                easeType: EasingType.Linear,
            },
        });
    } catch (error) {
    }
});

function restoreFov(event) {
    const player = event.source;
    const item = event.itemStack;
    if (!player || item?.typeId !== BOW_ITEM_ID) return;
    player.camera.clear();
}

world.afterEvents.itemStopUse.subscribe(restoreFov);
world.afterEvents.itemReleaseUse.subscribe(restoreFov);*/