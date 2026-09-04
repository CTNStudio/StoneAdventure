import { system } from "@minecraft/server";
export function showStoneHeartFeedback(player, isEmpty = false) {
    system.run(() => {
        player.playSound(isEmpty ? 'stonecraft.stone_heart_broken' : 'stonecraft.stone_heart_hurt', {
            volume: 0.6,
            pitch: 1.4
        });
    });
  
}