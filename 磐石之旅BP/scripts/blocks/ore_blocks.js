import { BlockRegistry, OreBlock } from "../lib/StoneAPI/blocks.js";

const blocks = new BlockRegistry();

const ore = new OreBlock("stonecraft:custom_ore");
    ore.onBreak = (ev) => {};
    blocks.add(ore);

    blocks.register();
