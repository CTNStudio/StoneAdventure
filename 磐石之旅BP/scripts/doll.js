import { system,  } from "@minecraft/server";
system.beforeEvents.startup.subscribe((event)=>{
  event.blockComponentRegistry.registerCustomComponent("stonecraft:doll",{
    onPlayerInteract: (event) => {
      const { player, block, dimension } = event;
      let location = block.location;
      dimension.playSound("note.pling", location, { volume: 1.0, pitch: 1.0 });
      player.addEffect("saturation", 2400);
      player.addEffect("regeneration", 2400, { amplifier: 1 })
    }
  });
})