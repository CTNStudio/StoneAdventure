import {
  world,
  Player,
  EquipmentSlot,
  EntityComponentTypes,
  system
} from "@minecraft/server";

// 可被潜行转换为草径的方块
const pathConvertibleBlocks = [
  "minecraft:dirt",
  "minecraft:grass_block",
  "minecraft:coarse_dirt",
  "minecraft:rooted_dirt",
  "minecraft:podzol",
  "minecraft:mycelium"
];

//菌丝，灰化土只能被锹转化为草径，砂土被锹直接转为草径，被锄转为耕，缠根泥土被锹转为草径，被锄转为泥土

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block } = event;
  if (!player || !block) return;

  //检查方块是否在可转换列表中
  if (!pathConvertibleBlocks.includes(block.typeId)) return;

  //获取主手物品
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const heldItem = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!heldItem) return;

  //检查物品是否带有 versatile 标签
  if (!heldItem.hasTag("stonecraft:versatile")) return;

  //检查玩家是否处于潜行状态
  if (!player.isSneaking) return;

  //延迟到下一个 tick 执行方块替换（beforeEvents 中不能直接修改方块）
  system.run(() => {
    const dimension = block.dimension;
    // 使用 runCommandAsync 或 setBlockType 都可以，这里用命令更直观
    dimension.runCommand(
      `setblock ${block.x} ${block.y} ${block.z} minecraft:grass_path`
    );
    player.playSound("dig.grass");
  });
});