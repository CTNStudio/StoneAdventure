import { world, system } from '@minecraft/server';
import { displayMessage, messageChannels } from "../messageManager.js";

system.beforeEvents.startup.subscribe((event) => {
    event.blockComponentRegistry.registerCustomComponent("stonecraft:petrified_husk", {
        onPlayerInteract: (event) => {
            const { player, block, dimension } = event;
            const hasEffects = player.getEffect("bad_omen");
            const level = player.level;
            const { x, y, z } = block.location;

            if (!player) return;
            if (level < 55 || !hasEffects) {//&&
                const ph_reject={ translate: "stonecraft.summon_boss.level_too_low" };
                displayMessage(player, ph_reject, { channel: messageChannels.actionbar });
                return;
            }

            player.playSound("shriek.sculk_shrieker", { location: block.location, volume: 1.0, pitch: 1.0});
            player.runCommand(`fill ~-4 ~ ~-7 ~8 ~2 ~7 air replace sculk`); //方案2
            //player.runCommand(`tp @s ~ ~8 ~2`);//防止玩家在下面被八角笼中,方案1
            player.dimension.runCommand(`setblock ${x} ${y} ${z} air`);
            dimension.spawnEntity('stonecraft:pale_martyr', { x, y, z });
            
        }
    });
});