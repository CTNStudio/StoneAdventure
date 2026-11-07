import {
  system,
  CommandPermissionLevel,
  CustomCommandParamType,
} from "@minecraft/server";
import { removeCurse, removeBlessing, hasSeal } from "./index.js";

function parseIndex(raw) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 7) return undefined;
  return value;
}

function registerWithIndex(customCommandRegistry, name, description, handler) {
  try {
    customCommandRegistry.registerCommand(
      {
        name,
        description,
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [{ name: "index", type: CustomCommandParamType.Integer }],
      },
      (origin, index) => {
        const player = origin.sourceEntity;
        if (player?.typeId !== "minecraft:player") return;
        const id = parseIndex(index);
        if (id === undefined) {
          player.sendMessage({ translate: "stonecraft.septem.cmd.bad_index" });
          return;
        }
        system.run(() => handler(player, id));
      }
    );
  } catch (error) {
    console.error(`[SevenCurses] register command ${name} failed:`, error);
  }
}

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  if (!customCommandRegistry) {
    console.error("[SevenCurses] customCommandRegistry is unavailable");
    return;
  }

  registerWithIndex(
    customCommandRegistry,
    "sa:seven remove curse",
    "解除一条七咒诅咒",
    (player, id) => {
      if (!hasSeal(player)) {
        player.sendMessage({ translate: "stonecraft.septem.cmd.no_seal" });
        return;
      }
      if (removeCurse(player, id)) {
        player.sendMessage({
          rawtext: [{ translate: "stonecraft.septem.cmd.curse_done" }, { text: String(id) }],
        });
      }
    }
  );

  registerWithIndex(
    customCommandRegistry,
    "sa:seven remove bless",
    "解除一条七祝福",
    (player, id) => {
      if (!hasSeal(player)) {
        player.sendMessage({ translate: "stonecraft.septem.cmd.no_seal" });
        return;
      }
      if (removeBlessing(player, id)) {
        player.sendMessage({
          rawtext: [{ translate: "stonecraft.septem.cmd.bless_done" }, { text: String(id) }],
        });
      }
    }
  );
});
