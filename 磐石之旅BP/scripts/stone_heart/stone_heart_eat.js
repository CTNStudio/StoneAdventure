import { world, system } from "@minecraft/server";
import { increaseStoneHeartMax } from "./stone_heart_core.js";

world.afterEvents.itemCompleteUse.subscribe((event) => {
    const player = event.source;
    const itemId = event.itemStack.typeId;

    switch (itemId) {
        case "stonecraft:stone_apple": increaseStoneHeartMax(player, 4); break;
        default: break;
    }
    system.run(() => {
        player.playSound("random.levelup", {
            volume: 0.6,
            pitch: 1.4
        });
    });
});