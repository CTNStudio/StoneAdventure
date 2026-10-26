import { StarTenon } from "./lib/StarTenonAPI/index.js";
import "./quests/quests_core.js";
import "./quests/quests_ui.js";
import { displayMessage } from "./messageManager.js";
import "./food.js";
import "./items/durability.js";
import { initAttackDurability } from "./items/attack_durability.js";
import "./entities_effect.js";
import "./blocks/ore_blocks.js";
import "./items/stone_nugget.js";
import "./items/tools_use.js";
import "./items/gun_test.js";
import "./items/stone_bow.js";
import "./items/stone_shield.js";
import "./custom_crop.js";
import "./custom_command.js";
import "./items/items_lore.js";
import "./doll.js";
import "./stone_point.js";
import "./shop/shop.js";
import "./stone_tide/stone_tide.js";
import "./summon_boss/boss_structure_spawner.js";
import "./summon_boss/blood_offering_vial.js";
import "./summon_boss/sacrificial_blade.js";
import './entities/ancient_stone_totem.js';
import './entities/spire_remnant.js';
import './entities/pale_martyr.js';
import './entities/stone_vagabond.js';
import "./stone_heart/stone_heart_core.js";
import "./stone_heart/stone_heart_eat.js";
import "./stone_heart/stone_heart_feedback.js";
import './stone_heart/stone_heart_display.js';
import { initForgeCore } from "./forge/forge_core.js";
import { initPlayerAttributes } from "./forge/player_attributes.js";
import { initWeaponEffects } from "./forge/weapon_effects.js";
import { initSpearEffects } from "./forge/special_effects/spear_effects.js";
import { initComboEffects } from "./forge/special_effects/combo_effects.js";
import { initDurabilityEffects } from "./forge/special_effects/durability_effects.js";
import { initDamageEffects } from "./forge/special_effects/damage_effects.js";
import { world } from "@minecraft/server";
//我嘞个超长导入啊

initForgeCore();
initPlayerAttributes();
initWeaponEffects();
initSpearEffects();
initComboEffects();
initDurabilityEffects();
initDamageEffects();
initAttackDurability();

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
    displayMessage(player, rawMessage);
});

console.info(`[StarTenon] Occultus SDK · Star Tenon API v${StarTenon.version}（MIT · CTN Studios）`);
