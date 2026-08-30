import { showQuestBook, giveItem } from "./quests/quests_core.js";
import { system, ItemStack, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerCommand(
        {
            name: "sa:sab",
            description: "打开磐石大典",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        (origin) => {
            const player = origin.sourceEntity;
            
            system.run(() => {
                showQuestBook(player);
            });
        }
    );
    customCommandRegistry.registerCommand(
        {
            name: "sa:wwssadadbabastonefree",
            description: "你发现了彩蛋",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: true,
        },
        (origin) => {
            const player = origin.sourceEntity;
            const cheatItem = new ItemStack('stonecraft:uc_stone_sword', 1);
            system.run(() => {
                giveItem(player, cheatItem);
            });
        }
    );
});