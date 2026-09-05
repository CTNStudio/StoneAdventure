import "./quests/quests_core.js";
import "./food.js";
import "./durability.js";
import "./entities_effect.js";
import "./stone_nugget.js";
import "./custom_crop.js";
import "./custom_command.js";
import "./items_lore.js";
import "./doll.js";
import "./summon_boss/boss_structure_spawner.js";
import "./summon_boss/blood_offering_vial.js";
import "./summon_boss/sacrificial_blade.js";
import './entities/ancient_stone_totem.js';
import './entities/spire_remnant.js';
import "./stone_heart/stone_heart_core.js";
import "./stone_heart/stone_heart_eat.js";
import "./stone_heart/stone_heart_feedback.js";
import './stone_heart/stone_heart_display.js';
import { initForgeCore } from "./forge/forge_core.js";
import { initPlayerAttributes } from "./forge/player_attributes.js";
import { initWeaponEffects } from "./forge/weapon_effects.js";
import { world } from "@minecraft/server";
//我嘞个超长导入啊
initForgeCore();
initPlayerAttributes();
initWeaponEffects();

world.afterEvents.playerSpawn.subscribe((eventData) => {
    if (!eventData.initialSpawn) return;
    const player = eventData.player;
    const rawMessage = {
        rawtext: [
            { translate: "stonecraft.welcome.message" },
            { text: " " },
            { text: player.name }
        ]
    };
    player.sendMessage(rawMessage);
});
