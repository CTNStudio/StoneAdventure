import { ShootersEffects } from '../lib/StoneAPI/shooters_effects';

new ShootersEffects({
    attackerTypeId: 'stonecraft:sandstone_shooter',
    effectId: 'minecraft:hunger',
    duration: 200
}).start();