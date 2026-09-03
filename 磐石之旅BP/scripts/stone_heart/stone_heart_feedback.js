import { system } from "@minecraft/server";
export function showStoneHeartFeedback(player) {
    system.run(() => {
        player.playSound('random.anvil_land', {
            volume: 0.6,
            pitch: 1.4
        });
    });
  
}