import { system, world } from '@minecraft/server';
import { getStoneHeart, getStoneHeartMax } from './stone_heart_core.js';
import { displayModes, getDisplayMode } from '../settings.js';

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const displayMode = getDisplayMode(player);
    if (displayMode !== displayModes.ui) continue;

    const max = getStoneHeartMax(player);
    if (max <= 0) {
      continue;
    }

    const current = getStoneHeart(player);
    const healthPercent = Math.round(
      Math.min(1, Math.max(0, current / max)) * 50
    ) * 2;

    player.onScreenDisplay.setActionBar(`!.${healthPercent}%`);
  }
}, 2);