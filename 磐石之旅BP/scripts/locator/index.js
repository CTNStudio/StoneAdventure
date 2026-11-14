import { world, system } from "@minecraft/server";
import { openLocator } from "./locator_ui.js";

world.afterEvents.itemUse.subscribe(event => {
    if (event.itemStack?.typeId !== "stonecraft:trail_compass") return;
    const player = event.source;
    if (!player?.isValid) return;
    system.run(() => {
        if (player.isValid) openLocator(player);
    });
});
