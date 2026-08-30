import { world, Player, system } from "@minecraft/server";
//食物效果
const NEGATIVE_EFFECTS = [
    "slowness", "mining_fatigue", "instant_damage", "nausea", "blindness",
    "hunger", "weakness", "poison", "wither", "fatal_poison", "levitation",
    "darkness", "wind_charged", "weaving", "oozing", "infested"
];

function giveNegativeEffect(player, type) {
    if (type === 'bad') {
        NEGATIVE_EFFECTS.forEach(effectId => {
            player.addEffect(effectId, 400, { amplifier: 0 });
        });
    }
}

export function clearEffect(player, type) {
    if (type === 'bad') {
        NEGATIVE_EFFECTS.forEach(effectId => {
            player.removeEffect(effectId);
        });
    }
}

world.afterEvents.itemCompleteUse.subscribe((event) => {
    const player = event.source;
    const itemId = event.itemStack.typeId;

    switch (itemId) {
        case "stonecraft:stone_apple": clearEffect(player, 'bad'); break;
        case "stonecraft:stone_bread": player.addEffect("resistance", 1000); break;
        case "stonecraft:stone_potato": player.addEffect("speed", 300, { amplifier: 0 }); break;
        case "stonecraft:stone_carrot": player.addEffect("night_vision", 300, { amplifier: 0 }); break;
        case "stonecraft:stone_melon": player.addEffect("regeneration", 300, { amplifier: 0 }); break;
        case "stonecraft:stonickers": player.addEffect("haste", 100); break;
        case "stonecraft:compressed_stonickers_lv1":
            player.addEffect("haste", 200, { amplifier: 1 });
            player.addEffect("strength", 100);
            break;
        case "stonecraft:compressed_stonickers_lv2":
            player.addEffect("haste", 300, { amplifier: 2 });
            player.addEffect("strength", 200, { amplifier: 1 });
            player.addEffect("absorption", 100);
            break;
        case "stonecraft:compressed_stonickers_lv3":
            player.addEffect("haste", 500, { amplifier: 3 });
            player.addEffect("strength", 300, { amplifier: 2 });
            player.addEffect("absorption", 200, { amplifier: 1 });
            player.addEffect("health_boost", 100);
            break;
        case "stonecraft:compressed_stonickers_lv4":
            player.addEffect("haste", 700, { amplifier: 4 });
            player.addEffect("strength", 500, { amplifier: 3 });
            player.addEffect("absorption", 300, { amplifier: 2 });
            player.addEffect("health_boost", 200, { amplifier: 1 });
            player.addEffect("slowness", 100);
            break;
        case "stonecraft:compressed_stonickers_lv5":
            player.addEffect("haste", 1500, { amplifier: 5 });
            player.addEffect("strength", 1000, { amplifier: 4 });
            player.addEffect("absorption", 800, { amplifier: 3 });
            player.addEffect("health_boost", 700, { amplifier: 2 });
            player.addEffect("slowness", 300, { amplifier: 1 });
            player.addEffect("resistance", 200, { amplifier: 0 });
            break;
        case "stonecraft:stone_kelp": player.addEffect("water_breathing", 300); break;
        case "stonecraft:stone_cooked_beef": player.addEffect("saturation", 300); break;
        case "stonecraft:stone_cooked_cod":
            player.addEffect("night_vision", 300);
            player.addEffect("water_breathing", 300);
            break;
        case "stonecraft:stone_cookie":
            player.addEffect("speed", 300);
            player.addEffect("poison", 75);
            break;
        case "stonecraft:stone_glow_berries":
            player.addEffect("night_vision", 300);
            player.addEffect("haste", 300);
            break;
        case "stonecraft:stone_sweet_berries": player.addEffect("resistance", 300); break;
        case "stonecraft:stone_hodgepodge":
            clearEffect(player, 'bad');
            player.addEffect("resistance", 1000);
            player.addEffect("speed", 300, { amplifier: 1 });
            player.addEffect("night_vision", 300, { amplifier: 1 });
            player.addEffect("regeneration", 300, { amplifier: 1 });
            player.addEffect("water_breathing", 300);
            break;
        case "stonecraft:blindness_potion": player.addEffect("blindness", 400); break;
        case "stonecraft:longer_blindness_potion": player.addEffect("blindness", 800); break;
        case "stonecraft:potion_of_growth":
            player.addEffect("regeneration", 400); 
            player.addEffect("absorption", 400, { amplifier: 1 });
            break;
        case "stonecraft:potion_of_corruption":
            player.addEffect("wither", 400); 
            player.addEffect("fatal_poison", 400, { amplifier: 1 });
            break;
        case "stonecraft:ersatz_blood_vial":
            giveNegativeEffect(player, 'bad');
            const ersatz_blood_vial_message = {
                translate: "stonecraft.drink_ersatz_blood_vial"
            };
            player.onScreenDisplay.setActionBar(ersatz_blood_vial_message);
            break;
        case "stonecraft:blood_bottle":
            const blood_bottle_message = {
               translate: "stonecraft.drink_blood"
            };
            player.onScreenDisplay.setActionBar(blood_bottle_message);
            break;
        default: break;
    }
});