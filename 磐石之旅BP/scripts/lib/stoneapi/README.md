# StoneAPI —— 工具与方块交互库

补齐自定义工具与方块交互时的原版反馈（音效、耐久）。按物品声明的 `type` 分类，
并且**只在该方块确实发生了对应变化时**才触发，不会"用一下就响"。

## 用法

只提供"注册表 + 类"一种写法，组件名由调用方传入，可分散在多个脚本里各自注册：

```js
import { StoneToolRegistry } from "../lib/stoneapi/index.js";

const tools = new StoneToolRegistry();
tools.addComponent("stonecraft:custom_tool");   // ← 组件名在这里定义
tools.register();                               // ← 必须调用，否则组件不会被注册
```

可链式配置：

```js
const tools = new StoneToolRegistry()
  .addComponent("stonecraft:custom_tool")
  .addTag("stonecraft:versatile", "versatile")   // 标签方式识别（不依赖自定义组件）
  .on("axe", (player, block, afterTypeId) => {
    player.sendMessage(`已处理：${afterTypeId}`);
  })
  .register();
```

- `register()` 幂等；多个注册表可共存，交互事件只订阅一次。
- `on(type, hook)` 挂交互成功后的回调，参数为 `(player, block, afterTypeId)`。

## 物品侧声明

在物品 JSON 的 `components` 里声明**与 `addComponent` 同名的**组件，用 `type` 区分：

```jsonc
"stonecraft:custom_tool": {
  "type": "axe"        // axe / shovel / hoe / versatile
}
```

> **关键**：自定义组件要求物品 `format_version >= 1.21.90`，否则组件会被**静默忽略**
>（不报错、也不生效）。该版本下 `menu_category.group` 还必须带命名空间，
>  例如 `minecraft:itemGroup.name.axe`。

同一个组件名可以承载所有类型 —— `type` 是每件物品自己写的，不是注册时定的。

## 已支持的类型

| type | 成功判据（交互后的方块类型） | 音效 |
| --- | --- | --- |
| `axe` | 包含 `stripped` | 按材质取，见下 |
| `shovel` | `minecraft:grass_path` 或 `minecraft:dirt_path` | `use.grass` |
| `hoe` | `minecraft:farmland` | `step.gravel` |
| `versatile` | 上述**任一**结果 | 按实际结果取对应音效 |

### 去皮音效按材质区分

由 `getStripSound(strippedTypeId)` 决定，判据是**去皮后的方块类型**（因此不需要任何方块 id 列表）：

| 去皮结果包含 | 音效 |
| --- | --- |
| `crimson` 或 `warped`（绯红/诡异菌柄菌核） | `step.stem` |
| `cherry`（樱花） | `step.cherry_wood` |
| 其他（橡木、云杉、深色橡木、红树、苍白橡木、竹块…） | `use.wood` |

新增木材只需在 `getStripSound` 里加一行 `else if`：

```js
export function getStripSound(strippedTypeId) {
  if (strippedTypeId.includes("crimson") || strippedTypeId.includes("warped")) return "step.stem";
  if (strippedTypeId.includes("cherry")) return "step.cherry_wood";
  // if (strippedTypeId.includes("新的木头")) return "新的音效";
  return "use.wood";
}
```

`axe` 与 `versatile` 的去皮分支都走这个函数，改一处两边同时生效。

判定方式是比对同一坐标在交互前后的方块类型，所以：

- 对不可交互方块用工具 → 类型不变 → 不响
- 对已去皮木头再用斧 → 类型不变 → 不响
- 用斧刮氧化铜 → 类型变了但不是 `stripped` → 不响

## 行为说明

- 音效通过 `dimension.playSound(sound, { x, y, z })` 在**方块坐标**播放，附近玩家都能听到
  （`player.playSound` 只有当事人听得到）。
- 生存模式交互成功时扣 **1 点耐久**，创造模式不扣。
- 注册的自定义组件是**空对象**（不挂 `onUseOn`）：挂了会让引擎把物品视为"可对方块使用"，
  导致**右键任何方块都播放挥臂动作**，这是刻意避免的。

## 已知限制

引擎决定是否播放挥臂动画，只取决于物品有没有 `onUseOn` 组件，不会判断当前方块是否可交互。
因此无法做到"只在去皮时挥动" —— 要挥动就得接受"对任何方块都挥动"，本库选择不挥动。
