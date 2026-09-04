import { showQuestBook, giveItem } from "./quests/quests_core.js";
import { world, system, ItemStack, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { setStoneHeartMax, getStoneHeart, getStoneHeartMax } from "./stone_heart/stone_heart_core.js";

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
    customCommandRegistry.registerCommand(
        {
            name: "sa:clear_stone_heart",
            description: "清除石心",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: true,
        },
        (origin) => {
            const players = world.getAllPlayers();
            for (const player of players) {
                setStoneHeartMax(player, 0);
            }
            const executor = origin.sourceEntity;
            if (executor) {
                executor.sendMessage("§a已清除所有玩家的石心数据。");
            }
        }
    );
    customCommandRegistry.registerCommand(
        {
            name: "sa:show_stone_heart",
            description: "显示石心",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
        },
        (origin) => {
            const players = world.getAllPlayers();
            const executor = origin.sourceEntity;
            for (const player of players) {
                const stoneHeart = getStoneHeart(player);
                const stoneHeartMax = getStoneHeartMax(player, 0);
                if (executor) {
                    executor.sendMessage(`§a${player.name}: ${stoneHeart}/${stoneHeartMax}`);
                }
            }
            if (executor) {
                executor.sendMessage("§a已显示所有玩家的石心（持有/上限）。");
            }
        }
    );
});