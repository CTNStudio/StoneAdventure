import {
  system,
} from "@minecraft/server";

import {
  getOrZero,
} from "./forge_utils.js";

export const TIMED_EFFECT_CONFIG = {
  resistance: {
    effectId: "resistance",
    playerKey: "stonecraft:resistance",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 9999999,
    durationPerLevelTicks: 0,
    armorOnly: true,
    getAmplifier: (level) =>
      Math.min(
        Math.floor(
          4.5 * (1 - Math.exp(-0.19 * level))
        ),
        4
      ),
  },

  health_boost: {
    effectId: "health_boost",
    playerKey: "stonecraft:health_boost",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 9999999,
    durationPerLevelTicks: 0,
    armorOnly: true,
    getAmplifier: (level) =>
      Math.max(level - 1, 0),
  },

  night_vision: {
    effectId: "night_vision",
    playerKey: "stonecraft:night_vision",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 5 * 20,
    durationPerLevelTicks: 10 * 20,
    armorOnly: true,
    getAmplifier: (level) =>
      Math.max(level - 1, 0),
  },

  fire_resistance: {
    effectId: "fire_resistance",
    playerKey: "stonecraft:fire_resistance",
    cooldownTicks: 60 * 20,
    baseDurationTicks: 10 * 20,
    durationPerLevelTicks: 10 * 20,
    armorOnly: true,
    getAmplifier: (level) =>
      Math.max(level - 1, 0),
  },
};

export const TIMED_EFFECT_REFRESHERS = new Map();

function getManagedKey(config) {
  return `stonecraft:managed_${config.effectId}`;
}

export function getTimedEffectIds() {
  return Object.values(
    TIMED_EFFECT_CONFIG
  ).map((config) => config.effectId);
}

export function computeTimedDuration(
  config,
  level
) {
  const normalized = Math.max(
    0,
    Number(level) || 0
  );

  if (normalized <= 0) {
    return 0;
  }

  return Math.round(
    config.baseDurationTicks +
    normalized *
      config.durationPerLevelTicks
  );
}

export function isPlayerValid(player) {
  try {
    return !!player && player.isValid();
  } catch {
    return !!player;
  }
}

function markManaged(
  player,
  config
) {
  try {
    player.setDynamicProperty(
      getManagedKey(config),
      true
    );
  } catch {}
}

function unmarkManaged(
  player,
  config
) {
  try {
    player.setDynamicProperty(
      getManagedKey(config),
      false
    );
  } catch {}
}

function isManaged(
  player,
  config
) {
  return getOrZero(
    player,
    getManagedKey(config),
    0
  ) === 1;
}

export function applyTimedSustainedEffects(
  player
) {
  try {
    for (
      const config of Object.values(
        TIMED_EFFECT_CONFIG
      )
    ) {
      const level = getOrZero(
        player,
        config.playerKey,
        0
      );

      const effect = player.getEffect(
        config.effectId
      );

      if (level <= 0) {
        if (
          effect &&
          isManaged(
            player,
            config
          )
        ) {
          try {
            player.removeEffect(
              config.effectId
            );
          } catch {}
        }

        unmarkManaged(
          player,
          config
        );

        continue;
      }

      const amplifier =
        config.getAmplifier
          ? config.getAmplifier(level)
          : Math.max(
              level - 1,
              0
            );

      const duration =
        computeTimedDuration(
          config,
          level
        );

      if (!effect) {
        try {
          player.addEffect(
            config.effectId,
            duration,
            {
              amplifier: amplifier,
              showParticles: false,
            }
          );

          markManaged(
            player,
            config
          );
        } catch (error) {
          console.warn(
            `[Stonecraft] timed effect ${config.effectId} failed to apply`,
            error
          );
        }

        continue;
      }

      if (
        effect.amplifier !==
        amplifier
      ) {
        try {
          player.removeEffect(
            config.effectId
          );

          player.addEffect(
            config.effectId,
            duration,
            {
              amplifier: amplifier,
              showParticles: false,
            }
          );

          markManaged(
            player,
            config
          );
        } catch (error) {
          console.warn(
            `[Stonecraft] timed effect ${config.effectId} failed to update`,
            error
          );
        }

        continue;
      }

      if (
        effect.duration <
        duration / 2
      ) {
        try {
          player.addEffect(
            config.effectId,
            duration,
            {
              amplifier: amplifier,
              showParticles: false,
            }
          );

          markManaged(
            player,
            config
          );
        } catch (error) {
          console.warn(
            `[Stonecraft] timed effect ${config.effectId} failed to refresh`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "[Stonecraft] applyTimedSustainedEffects failed:",
      error
    );
  }
}

export function clearTimedEffects(
  player
) {
  for (
    const config of Object.values(
      TIMED_EFFECT_CONFIG
    )
  ) {
    try {
      if (
        isManaged(
          player,
          config
        )
      ) {
        player.removeEffect(
          config.effectId
        );
      }

      unmarkManaged(
        player,
        config
      );
    } catch {}
  }
}

export function scheduleTimedRefresh(
  player,
  config
) {
  try {
    const playerId =
      player?.id ??
      player?.nameTag ??
      "unknown";

    const refreshKey =
      `${playerId}:${config.effectId}`;

    if (
      TIMED_EFFECT_REFRESHERS.has(
        refreshKey
      )
    ) {
      return;
    }

    const cooldownTicks =
      Math.max(
        1,
        Number(
          config.cooldownTicks
        ) || 1
      );

    const handle =
      system.runTimeout(
        () => {
          try {
            TIMED_EFFECT_REFRESHERS.delete(
              refreshKey
            );

            if (
              !isPlayerValid(
                player
              )
            ) {
              return;
            }

            const level =
              getOrZero(
                player,
                config.playerKey,
                0
              );

            if (
              level <= 0
            ) {
              scheduleTimedRefresh(
                player,
                config
              );

              return;
            }

            const amplifier =
              config.getAmplifier
                ? config.getAmplifier(
                    level
                  )
                : Math.max(
                    level - 1,
                    0
                  );

            const duration =
              computeTimedDuration(
                config,
                level
              );

            const effect =
              player.getEffect(
                config.effectId
              );

            if (!effect) {
              player.addEffect(
                config.effectId,
                duration,
                {
                  amplifier:
                    amplifier,
                  showParticles:
                    false,
                }
              );

              markManaged(
                player,
                config
              );
            } else if (
              effect.amplifier !==
              amplifier
            ) {
              player.removeEffect(
                config.effectId
              );

              player.addEffect(
                config.effectId,
                duration,
                {
                  amplifier:
                    amplifier,
                  showParticles:
                    false,
                }
              );

              markManaged(
                player,
                config
              );
            } else if (
              effect.duration <
              duration / 2
            ) {
              player.addEffect(
                config.effectId,
                duration,
                {
                  amplifier:
                    amplifier,
                  showParticles:
                    false,
                }
              );

              markManaged(
                player,
                config
              );
            }

            scheduleTimedRefresh(
              player,
              config
            );
          } catch (error) {
            console.warn(
              `[Stonecraft] timed effect ${config.effectId} schedule failed`,
              error
            );
          }
        },
        cooldownTicks
      );

    TIMED_EFFECT_REFRESHERS.set(
      refreshKey,
      handle
    );
  } catch (error) {
    console.warn(
      `[Stonecraft] scheduleTimedRefresh(${config.effectId}) failed`,
      error
    );
  }
}