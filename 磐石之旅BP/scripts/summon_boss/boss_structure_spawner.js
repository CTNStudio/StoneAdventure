//搭建石头图腾
import { world } from '@minecraft/server';
export class AncientStoneTotemStructureSpawner {

    /**以此结构生成石头图腾
     * @param {string} headBlockTypeId
     * @param {string} bodyBlockTypeId
     * @param {string} spawnEntityTypeId
     */
    constructor(headBlockTypeId, bodyBlockTypeId, spawnEntityTypeId) {
        this.head_block_type = headBlockTypeId;
        this.body_block_type = bodyBlockTypeId;
        this.spawn_entity_type = spawnEntityTypeId;

        world.afterEvents.playerPlaceBlock.subscribe(this.handleBlockPlacement.bind(this));
    }

    handleBlockPlacement(event) {
        const player = event.player;
        const block = event.block;

        //位于世界底部时 below() 会抛 LocationOutOfWorldBoundariesError，取不到就说明该处不可能搭成结构
        let blockBelow1;
        let blockBelow2;
        try {
            blockBelow1 = block.below();
            blockBelow2 = blockBelow1.below();
        } catch {
            return;
        }
        if (!blockBelow1 || !blockBelow2) return;

        const structureBlocks = [block, blockBelow1, blockBelow2];

        const isHeadBlock = block.typeId == this.head_block_type;
        const isBodyBlock = blockBelow1.typeId == this.body_block_type && blockBelow2.typeId == this.body_block_type;

        if (isHeadBlock && isBodyBlock) {
            structureBlocks.forEach(structureBlock => {
                const { x, y, z } = structureBlock.location;
                player.dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
            });
            player.dimension.spawnEntity(this.spawn_entity_type, blockBelow2.location);
        }
    }
}
export const AncientStoneTotem = new AncientStoneTotemStructureSpawner('stonecraft:stone_summoner_activated', 'stonecraft:lv5stone', 'stonecraft:ancient_stone_totem')