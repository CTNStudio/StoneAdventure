import { system, world } from '@minecraft/server';
import { getStoneHeart, getStoneHeartMax } from './stone_heart_core.js';

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const max = getStoneHeartMax(player);
    if (max <= 0) {
      player.onScreenDisplay.setActionBar('');
      continue;
    }
    const current = getStoneHeart(player);
    // HUD 使用半心作为最小单位：1 HP = 1 个半心。
    const displayValue = Math.round(current);
    player.onScreenDisplay.setActionBar(`!sh.${displayValue}`);
  }
}, 5);