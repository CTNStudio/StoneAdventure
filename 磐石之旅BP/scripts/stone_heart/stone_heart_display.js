import { system, world } from '@minecraft/server';
import { getStoneHeart, getStoneHeartMax } from './stone_heart_core.js';

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const max = getStoneHeartMax(player);
    if (max <= 0) {
      player.onScreenDisplay.setActionBar('!shx.');
      continue;
    }
    const current = getStoneHeart(player);
    const healthPercent = Math.round(
      Math.min(1, Math.max(0, current / max)) * 50
    ) * 2;

    player.onScreenDisplay.setActionBar(`!shr.${healthPercent}`);
  }
}, 5);