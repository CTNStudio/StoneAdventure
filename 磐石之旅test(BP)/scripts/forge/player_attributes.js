import {
  EquipmentSlot,
  EntityComponentTypes,
  system,
  world,
} from "@minecraft/server";

import {
  ATTRIBUTE_DEFS,
  getOrZero,
} from "./forge_utils.js";

import {
  TIMED_EFFECT_CONFIG,
  applyTimedSustainedEffects,
  isPlayerValid,
  scheduleTimedRefresh,
} from "./armor_timed_effects.js";

function getEquipmentItem(
  player,
  slot
) {
  try {
    const equip =
      player.getComponent(
        EntityComponentTypes.Equippable
      );

    return equip
      ? equip.getEquipment(slot) ??
          undefined
      : undefined;
  } catch {
    return undefined;
  }
}

function applySustainedEffects(
  player
) {
  try {
    applyTimedSustainedEffects(
      player
    );

    for (
      const config of Object.values(
        TIMED_EFFECT_CONFIG
      )
    ) {
      const level =
        getOrZero(
          player,
          config.playerKey,
          0
        );

      if (level > 0) {
        scheduleTimedRefresh(
          player,
          config
        );
      }
    }
  } catch (error) {
    console.error(
      "[Stonecraft] applySustainedEffects failed:",
      error
    );
  }
}

export function updatePlayerAttributes(
  player
) {
//console.error(`[ATTR] update ${player.name}`);
  if (
    !isPlayerValid(player)
  ) {
    return;
  }

  try {
    const armorSlots = [
      EquipmentSlot.Head,
      EquipmentSlot.Chest,
      EquipmentSlot.Legs,
      EquipmentSlot.Feet,
    ];

    const weaponSlots = [
      EquipmentSlot.Mainhand,
    ];

    const armorOnly =
      new Set(
        Object.values(
          TIMED_EFFECT_CONFIG
        )
          .filter(
            (config) =>
              config.armorOnly
          )
          .map(
            (config) =>
              config.effectId
          )
      );

    for (
      const def of ATTRIBUTE_DEFS
    ) {
      try {
        player.setDynamicProperty(
          def.playerKey,
          0
        );
      } catch {}
    }

    for (
      const def of ATTRIBUTE_DEFS
    ) {
      const slots =
        armorOnly.has(
          def.id
        )
          ? armorSlots
          : weaponSlots;

      let total = 0;

      for (
        const slot of slots
      ) {
        const item =
          getEquipmentItem(
            player,
            slot
          );

        if (!item) {
          continue;
        }

        total += getOrZero(
          item,
          def.key,
          0
        );
      }
    //console.warn(`[ATTR] ${player.name} ${def.id} = ${total}`);
      try {
        player.setDynamicProperty(
          def.playerKey,
          total
        );
      } catch {}
    }

    applySustainedEffects(
      player
    );
  } catch (error) {
    console.error(
      "[Stonecraft] updatePlayerAttributes failed:",
      error
    );
  }
}

function scheduleRetry(
  player,
  attempt = 0
) {
  system.runTimeout(
    () => {
      try {
        if (
          !isPlayerValid(
            player
          )
        ) {
          return;
        }

        updatePlayerAttributes(
          player
        );
      } catch (error) {
        console.error(
          "[Stonecraft] retry updatePlayerAttributes failed:",
          error
        );

        if (
          attempt < 2
        ) {
          scheduleRetry(
            player,
            attempt + 1
          );
        }
      }
    },
    2
  );
}

function scheduleByName(
  playerName,
  attempt = 0
) {
  system.runTimeout(
    () => {
      try {
        const player =
          world.getPlayers({
            name: playerName,
          })[0];

        if (!player) {
          if (
            attempt < 2
          ) {
            scheduleByName(
              playerName,
              attempt + 1
            );
          }

          return;
        }

        updatePlayerAttributes(
          player
        );
      } catch (error) {
        console.error(
          "[Stonecraft] scheduleByName failed:",
          error
        );

        if (
          attempt < 2
        ) {
          scheduleByName(
            playerName,
            attempt + 1
          );
        }
      }
    },
    2
  );
}

export function initPlayerAttributes() {
  const afterEvents =
    world?.afterEvents ?? {};

  if (
    afterEvents.playerJoin?.subscribe
  ) {
    afterEvents.playerJoin.subscribe(
      (event) => {
        if (event.player) {
          scheduleRetry(
            event.player
          );
        } else if (
          event.playerName
        ) {
          scheduleByName(
            event.playerName
          );
        }
      }
    );
  }

  if (
    afterEvents.playerSpawn?.subscribe
  ) {
    afterEvents.playerSpawn.subscribe(
      (event) => {
        if (event.player) {
          scheduleRetry(
            event.player
          );
        }
      }
    );
  }

  if (
    afterEvents
      .playerInventoryItemChange
      ?.subscribe
  ) {
    afterEvents.playerInventoryItemChange.subscribe(
      (event) => {
        const player =
          event.player;

        if (player) {
          scheduleRetry(
            player
          );
        }
      }
    );
  }

  if (
    afterEvents.playerArmorChange
      ?.subscribe
  ) {
    afterEvents.playerArmorChange.subscribe(
      (event) => {
        const player =
          event.player;

        if (player) {
          scheduleRetry(
            player
          );
        }
      }
    );
  }

  if (
    afterEvents.playerSlotChange
      ?.subscribe
  ) {
    afterEvents.playerSlotChange.subscribe(
      (event) => {
        const player =
          event.player;

        const slot =
          event.slot;

        const equipmentSlots = [
          EquipmentSlot.Head,
          EquipmentSlot.Chest,
          EquipmentSlot.Legs,
          EquipmentSlot.Feet,
          EquipmentSlot.Mainhand,
        ];

        if (
          player &&
          equipmentSlots.includes(
            slot
          )
        ) {
          scheduleRetry(
            player
          );
        }
      }
    );
  }

  if (
    afterEvents.itemCompleteUse
      ?.subscribe
  ) {
    afterEvents.itemCompleteUse.subscribe(
      (event) => {
        const player =
          event.source;

        if (!player) {
          return;
        }

        if (
          event.itemStack
            ?.typeId ===
          "minecraft:milk_bucket"
        ) {
          scheduleRetry(
            player
          );
        }
      }
    );
  }

  system.runInterval(
    () => {
      for (
        const player of
          world.getAllPlayers()
      ) {
        if (
          !isPlayerValid(
            player
          )
        ) {
          continue;
        }

        updatePlayerAttributes(
          player
        );
      }
    },
    1
  );
}