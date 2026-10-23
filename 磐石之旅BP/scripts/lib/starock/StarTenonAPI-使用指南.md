# StarTenonAPI（Occultus SDK）使用指南

> 目录：`/sdcard/A_Private/startenonapi`
> 版本：`@occultus/api` 0.31.0-alpha（API Level 13.1）· `@occultus/core` 1.1.0
> 定位：Minecraft 基岩版 **Script API 的 TypeScript 开发框架**，不是可直接安装的模组

---

## 0. 先弄清楚它是什么

StarTenonAPI（Occultus SDK）是一套**写基岩版脚本附加包时用的轮子**：

- 它本身不会在游戏里产生任何内容；
- 你要写一个行为包（BP），用 TypeScript 调它的类，再用 esbuild 打包成 `scripts/main.js`；
- 它帮你封装了：任务书、职业、Boss、技能、自定义物品/方块、模拟 Buff、战利品表、图鉴、教程、NPC 对话、持久化数据、Toast、UI 表单等；
- 由 CTN Studios 维护（主要作者方漓猫），和《磐石之旅》同一个工作室，所以它的任务/职业/图鉴接口和那类附加包的结构很像。


---

## 1. 仓库结构

```
startenonapi/
├─ packages/            # 各个子包（源码）
│  ├─ core?             # 不在这里，core 是单独发布的 @occultus/core
│  ├─ item/             # 自定义武器/工具/食物
│  ├─ block/            # 自定义方块/矿石/可交互方块
│  ├─ entity/           # Boss、Boss 技能、方块实体
│  ├─ task/             # 任务书/任务组/奖励/自动提交
│  ├─ condition/        # 物品/等级/经验/击杀条件
│  ├─ job/              # 职业、升级、转职、职业技能
│  ├─ skill/            # 技能基类与技能注册表
│  ├─ effect/           # 模拟状态效果
│  ├─ loot/             # 运行时战利品表
│  ├─ database/         # 持久化 key-value 数据
│  ├─ article/          # 文章/图鉴
│  ├─ tutorial/         # 教程中心
│  ├─ artifacts/        # 饰品与饰品槽
│  ├─ logue/            # 独白、NPC 对话
│  ├─ notification/     # Toast、欢迎/更新提示
│  ├─ music/            # 音乐唱片、Boss 音乐
│  ├─ format/ text/ time/ math/ random/ logger/ toolkit/ credits/
│  └─ ui/               # 空壳，未在聚合包里导出
├─ starock/             # 包名 @occultus/api，聚合所有子包，含打包脚本
├─ lang/zh_CN.lang      # 任务/职业/鸣谢界面的翻译键
└─ pnpm-workspace.yaml  # monorepo 配置
```

注意：

### 3.2 入口

```ts
import { ModInitializer } from "@occultus/core";
import { ItemRegistries, WeaponMaterial } from "@occultus/api";

// 1. 先初始化模组元数据（core 1.1.0 用构造函数，每个脚本环境只能一次）
const mod = new ModInitializer("mypack", "My Pack", "1.0.0");

// 2. 建注册表
const items = new ItemRegistries();

// 3. 定义一个武器“材料”
const blade = new WeaponMaterial("mypack:frost_blade");
blade.onHitEntity = (ev) => {
  ev.hitEntity?.addEffect("slowness", 60, { amplifier: 1 });
};

items.add(blade);
items.register(); // 注册自定义物品组件
```


### 3.4 物品 JSON 必须对上组件名

```json
{
  "format_version": "1.21.90",
  "minecraft:item": {
    "description": {
      "identifier": "mypack:frost_blade",
      "menu_category": { "category": "equipment" }
    },
    "components": {
      "minecraft:display_name": { "value": "item.mypack:frost_blade" },
      "minecraft:icon": "mypack.frost_blade",
      "minecraft:max_stack_size": 1,
      "minecraft:hand_equipped": true,
      "minecraft:damage": 7,
      "minecraft:durability": { "max_durability": 500 },
      "mypack:frost_blade": {}
    }
  }
}
```

**规则**：`WeaponMaterial("mypack:frost_blade")` 里的名字 = JSON 里 `components` 的键名，必须带命名空间、必须完全一致。

---

## 4. 核心概念

| 概念 | 作用 |
| --- | --- |
| `new ModInitializer(id, name, version)` | 初始化模组元数据（core 1.1.0 的写法） |
| `ModManager` | 全局注册表管理器；`Registries` 构造时会自动加入 |
| `Registries` | 注册表基类，自带 `id`、`add/get/has/delete/getAll/register` |
| `FormLike` | 所有 UI 类的基类，提供 `display(player, backTo)`、`quit`、`jumpTo` 的返回栈 |
| `TextProvider` | 文本类型：`string` / `RawMessage` / `(player) => string \| RawMessage` |
| `parseText` / `parseToRaw` | 把 `TextProvider` 解析成实际文本 |
| `ModMessageServer` | 用 `scriptevent` 在多个脚本包/模组之间收发消息 |
| `StarTenon.version` | 当前 API 版本，例如 `0.31.0 (API: 13.1)` |

`ModInitializer` 的几个要点：

- 每个脚本环境只能 `new` 一次，第二次会抛错；
- `id` 不能是 `default`，版本不能是 `0.0.0`；
- `JobServer`、`UpdateNotification` 等依赖 `ModInitializer` 里的 modId，**所以要先初始化再 new 它们**；
- 注册表的 `.register()` 请放在**模块顶层**，不要等 startup 回调里再订阅；
- core 1.1.0 的 `onInitialize()` 在构造后调用不会真正订阅 startup（源码只检查构造时的回调），启动逻辑直接写在顶层最稳；
- 如果用的是 core 2.0 beta，初始化 API 变成了静态的 `ModInitializer.initialize(...)`，和 1.1.0 不通用。

---

## 5. 具体能做什么（按场景）

### 5.1 自定义武器 / 工具 / 食物

```ts
import { ItemRegistries, WeaponMaterial, ToolMaterial, FoodMaterial } from "@occultus/api";

const items = new ItemRegistries();

// 武器：命中时上缓慢
const frost = new WeaponMaterial("mypack:frost_blade");
frost.onHitEntity = (ev) => {
  ev.hitEntity?.addEffect("slowness", 60, { amplifier: 1 });
};
items.add(frost);

// 工具：开启 use 事件后才有 onUse / onUseOn
const axe = new ToolMaterial("mypack:stone_axe", [], true);
axe.onUseOn = (ev) => {
  ev.source.sendMessage("你使用了斧头");
};
items.add(axe);

// 食物：组件参数在 JSON 里声明效果
const apple = new FoodMaterial("mypack:stone_apple");
apple.onConsume = (ev) => {
  ev.source.addEffect("regeneration", 100);
};
items.add(apple);

items.register();
```

食物 JSON 的组件参数（由 `FoodParams` 解析）：

```json
"mypack:stone_apple": {
  "effect": "GOOD",
  "duration": 200,
  "amplifier": 0,
  "show_particles": true,
  "clear": "BAD"
}
```

工具 JSON 要带 `type`：

```json
"mypack:stone_axe": { "type": "axe" }
```

> 工具/武器的 `onMineBlock` 默认会扣 1 点耐久；如果这个工具不归原版耐久管，参数里加 `"virtual": true`。
> `WeaponMaterial`/`ToolMaterial` 还支持 `builtinSkills`（内置技能数组）和每件物品上的技能动态属性。
> 判断物品等级可以用 `ItemTier.getTier(item)` / `ItemTier.hasTier(ItemTiers.Diamond, item)`。

### 5.1b 自定义矿石方块

```ts
import { BlockRegistries, OreBlock } from "@occultus/api";

const blocks = new BlockRegistries();

const rubyOre = new OreBlock("mypack:ruby_ore");
rubyOre.onBreak = (ev) => {
  ev.player?.sendMessage("挖到了红宝石矿");
};
blocks.add(rubyOre);
blocks.register();
```

方块 JSON 的组件参数：

```json
"mypack:ruby_ore": {
  "loot_table": "blocks/ruby_ore",
  "item_tier": "diamond",
  "exp": 5
}
```

- `loot_table` 是 `loot_tables/` 下的相对路径；
- `item_tier` 可以是 `wooden` / `stone` / `iron` / `diamond` / `netherite`，也可以用 `tag` 或 `item` 限定工具；
- 创造模式不会触发掉落；
- `InteractableBlock` 目前只是占位（内部 `onPlayerInteract` 是空的），可交互逻辑要自己写组件。

---

### 5.2 Boss 与 Boss 技能

```ts
import { Boss, BossSkill, BossServer } from "@occultus/api";

const bossServer = new BossServer();

const boss = new Boss(
  "mypack:stone_totem",                 // 实体 typeId
  [
    new BossSkill(
      "mypack:slam",                    // 技能 id
      100,                              // 冷却（刻）
      (executor, targets) => {
        for (const target of targets) {
          if (target.typeId === "minecraft:player") {
            target.applyDamage(4);
          }
        }
      },
      8                                 // 作用半径
    ),
  ],
  { trackId: "mypack.boss_theme", radius: 30 } // 战斗音乐，可选
);

bossServer.addBoss(boss);
```

- `BossServer` 会在实体生成 / 区块加载时自动挂技能循环；
- `BossSkill.execute` 每次先取半径内实体，再执行你的回调；
- `boss.onDie(cb)` 可以挂击杀奖励/解锁逻辑；
- 战斗音乐需要资源包里定义对应的 sound event。

---

### 5.3 任务书 / 任务链 / 奖励

```ts
import {
  Task, TaskGroup, TaskCenter, TaskServer,
  ItemConditions, KillEntityConditions, ItemAwards, ExpAwards,
} from "@occultus/api";

const taskServer = new TaskServer();

const q1 = new Task("mypack:q1", "初次采矿", "挖点圆石回来", {
  conditions: [new ItemConditions("minecraft:cobblestone", 16, true)],
  awards: [new ItemAwards("minecraft:bread", 3), new ExpAwards(50)],
  previousTask: "none",
  iconPath: "textures/items/stone_pickaxe",
});

const q2 = new Task("mypack:q2", "清理石头", "击杀一只石头守卫", {
  conditions: [new KillEntityConditions("mypack:stone_guard")],
  awards: [new ExpAwards(100)],
  previousTask: q1,
});

const chapter = new TaskGroup("mypack:chapter1", "第一章", "开始冒险", {
  tasks: [q1, q2],
  awards: [new ItemAwards("mypack:reward", 1)],
  previousTask: "none",
});

// 击杀类条件只能靠自动提交生效；物品类任务建议不要加，否则拾取即完成
q2.pushToServer(taskServer);

const center = new TaskCenter("mypack:book", "任务书", "按章节推进", {
  tasks: [chapter],
});

// 用物品右键打开任务书（物品 JSON 里加 "mypack:quest_book": {}）
center.addTrigger("mypack:quest_book");
```

可用的条件（`@occultus/condition-api`）：

- `ItemConditions(物品ID, 数量, 是否消耗)`
- `ItemTagConditions(标签, 数量, 翻译键, 是否消耗)`
- `LevelConditions(等级, 是否消耗)`
- `ExpConditions(经验, 是否消耗)`
- `KillEntityConditions(实体ID)`（必须 `pushToServer`）
- `KillEntityFamilyConditions(家族, 翻译键)`（必须 `pushToServer`）

奖励：

- `ItemAwards(物品ID, 数量)`
- `ExpAwards(经验)`
- `LevelAwards(等级)`

> **重要坑**：`TaskServer` 的“自动提交”是**事件触发即完成**，不检查数量，而且是“任一条件满足就完成”。
> 所以带数量的物品任务建议**不要** `pushToServer`，让玩家手动打开任务书提交；
> 击杀类任务本身只能靠 `pushToServer`，那么每次击杀都会直接完成整个任务。

打开方式除了物品组件，也可以注册自定义命令：

```ts
import { CommandPermissionLevel } from "@minecraft/server";

const cmd = {
  name: "mypack:book",
  description: "打开任务书",
  permissionLevel: CommandPermissionLevel.Any,
  cheatsRequired: false,
};
center.addTrigger(undefined, cmd);
```

---

### 5.4 职业 / 升级 / 转职

```ts
import { Job, JobCenter, JobServer, ItemConditions } from "@occultus/api";

const jobServer = new JobServer();

const miner = new Job("mypack:miner", "矿工", "靠挖矿吃饭", {
  maxLevel: 10,
  upgradeCondition: [
    {
      min: 0,
      max: 9,
      condition: [new ItemConditions("minecraft:iron_ore", 8, true)],
    },
  ],
  // transform: [{ condition: ..., job: otherJob }],
  // skills: [ ... ],
});

jobServer.addJob(miner);

const center = new JobCenter("mypack:jobs", jobServer);
center.addTrigger("mypack:job_book");

// 给玩家职业
miner.add(player);
```

- 职业等级存在玩家动态属性 `${modId}:job` / `${jobId}:level`；
- 升级条件按等级区间匹配（`min`~`max`）；
- `JobCenter` 会显示当前职业、等级、升级材料、转职列表；
- **必须先 `new ModInitializer(...)`**，否则 `JobServer` 拿不到 modId。

职业技能（物品形式）：

```ts
import { JobSkill } from "@occultus/api";

const dash = new JobSkill(
  "mypack:dash_scroll",   // 技能物品 ID
  "mypack:dash",          // 物品组件名
  "冲刺", "向前突进",
  20                      // 持续刻数，0 表示瞬发
);

dash.onRelease((ev) => {
  ev.source.addEffect("speed", 100, { amplifier: 2 });
});

// 写进 job.config.skills 后，获得职业时会自动发这个物品
```

技能物品 JSON 需要：

- 带 `mypack:dash` 组件；
- 带 `starock:job_skill` 标签。

---

### 5.5 模拟状态效果（自定义 Buff）

```ts
import { VirtualEffect, VirtualEffectType } from "@occultus/api";

const frost = new VirtualEffect(
  "mypack:frost",       // 唯一 id
  20,                    // 每 20 刻更新一次
  "霜冻",
  VirtualEffectType.BAD
);

frost.onUpdate((entity, amplifier) => {
  entity.applyDamage(1);
});

frost.onTimeOut((entity, amplifier) => {
  entity.sendMessage("霜冻消退了");
});

frost.add(player, 200, 1);  // 持续 200 刻，等级 1（0 起）
```

适合做原版效果表达不了的机制：层数、持续伤害、到期结算、专属 ActionBar 提示等。

---

### 5.6 自定义战利品表

```ts
import { CustomLootServer, CustomEntityLoot, CustomBlockLoot } from "@occultus/api";

const lootServer = new CustomLootServer();

lootServer.addLoot(
  new CustomEntityLoot("minecraft:zombie", "entities/zombie_extra")
);

lootServer.addLoot(
  new CustomBlockLoot("minecraft:diamond_ore", "blocks/diamond_extra")
);
```

路径是 `loot_tables/` 下的相对路径（不带 `.json`），内部用 `loot spawn` 命令生成。

---

### 5.7 持久化数据

```ts
import { Database } from "@occultus/database"; // 注意：不在 @occultus/api 里
import { world } from "@minecraft/server";

const db = Database.create(world);      // 数据源：world / entity / itemStack
db.write("coins", 100);
const coins = db.read("coins");
db.delete("coins");
```

- 默认每 60 秒同步一次，关服时也会 push；
- 可以自己传同步间隔：`Database.create(world, 20 * 10)`；
- 适合存金币、进度、解锁状态等。

---

### 5.8 教程 / 文章 / 图鉴 / 鸣谢

教程：

```ts
import { Tutorial, TutorialServer, TutorialCenter } from "@occultus/api";

const tutorial = new Tutorial(
  "mypack:first_night",
  "第一夜",
  [{ title: "提示", body: "先造一把石剑。" }],
  { type: "alwaysAvailable", iconPath: "textures/items/stone_sword" }
);

new TutorialServer().addTutorial(tutorial);

const center = new TutorialCenter("mypack:guide", "教程", "基础知识", [tutorial]);
center.addTrigger("mypack:guide_book");
```

`type` 可以是 `item` / `block` / `entity` / `dimension` / `alwaysAvailable` / `none`；
用 `item` 时教程 `id` 就是物品 ID，玩家拿到物品会自动解锁。

文章/图鉴：

```ts
import { Article, ArticleCenter } from "@occultus/api";

const lore = new Article(
  "mypack:lore",
  "石头简史",
  "……",
  [{ title: "第一章", body: "……" }]
);

const library = new ArticleCenter("mypack:library", "图书馆", "收集到的故事", "auto");
library.display(player, []);
```

鸣谢：

```ts
import { CreditsManager } from "@occultus/api";

const credits = new CreditsManager("制作名单", [
  "CTN Studios",
  {
    discipline: "程序",
    contributors: [{ name: "方漓猫", role: "程序" }],
  },
]);

// 通过自定义命令打开：credits.registerCommand(command)
```

---

### 5.9 独白 / NPC 对话 / Toast

```ts
import { Monologue, Dialogue, Toast } from "@occultus/api";

// 独白：按刻延迟逐句发到聊天栏，可带背景音乐
new Monologue("mypack:intro", "mypack.intro_music")
  .addMonologue("你醒了。", 0)
  .addMonologue("周围全是石头。", 40)
  .play(player);

// NPC 对话：实体需要 minecraft:npc 组件，场景在 RP 里定义
new Dialogue("mypack:npc", "scene_1").registry();

// Toast：需要客户端装 OpenToast 资源
new Toast("欢迎回来", "textures/items/apple").send(player);
```

---

### 5.10 饰品

```ts
import { Artifact, ArtifactSlot } from "@occultus/api";

const slot = new ArtifactSlot("ring", "戒指", "只能戴一枚");
const ring = new Artifact(
  "mypack:ring",
  "石戒",
  "装备后获得抗性",
  slot,
  "textures/items/ring"
);

ring.onEquip((ev) => ev.source.addEffect("resistance", 200));
ring.onHitEntity((ev) => {});
ring.onHurt((ev) => {});
```

饰品通过 UI 装备，槽位状态存在玩家动态属性 `starock:artifactSlot.<id>`。

---

### 5.11 常用工具

```ts
import { Format, Time, Random, Vector3Utils, NumberRangeUtils } from "@occultus/api";
import { giveItem, getItemAmountOfPlayer, consumeDurability, startCooldown } from "@occultus/api";

Format.bold + "重点" + Format.reset;
Time.getGameTimeSpec();          // Morning / Noon / Sunset / Night / Sunrise
Time.getLocalTime(8);            // UTC+8 的 Date
Random.integer(10);              // 0~10
Random.UUID();
NumberRangeUtils.isInRange(5, 0, 9);
```

`@occultus/toolkit` 还提供：`EntitiesUtils`（批量实体操作）、`getContainer`、`giveItem`、`removeItemOfPlayer`、`getTagItemAmountInContainer`、`consumeDurability`、`migrateEnchantments`、`isInCooldown`、`startCooldown`、`ensureNamespace`、`getAllExp` 等。

---

## 6. 想做什么 → 用哪个

| 目标 | 入口 |
| --- | --- |
| 自定义剑/斧/镐/食物 | `ItemRegistries` + `WeaponMaterial` / `ToolMaterial` / `FoodMaterial` |
| 自定义方块/矿石 | `BlockRegistries` + `InteractableBlock` / `OreBlock` |
| Boss 战 | `BossServer` + `Boss` + `BossSkill` |
| 任务书/成就系统 | `TaskCenter` + `Task` / `TaskGroup` + `condition-api` |
| 职业/转职/技能 | `JobServer` + `Job` + `JobCenter` + `JobSkill` |
| 自定义 Buff/Debuff | `VirtualEffect` |
| 改掉落 | `CustomLootServer` |
| 存档数据 | `Database`（单独安装） |
| 图鉴/剧情文本 | `ArticleCenter` / `TutorialCenter` / `Monologue` |
| 饰品栏 | `Artifact` + `ArtifactSlot` |
| 提示弹窗 | `Toast` |
| 数学/随机/时间/日志 | `math-api` / `random-api` / `time-api` / `logger-api` |

---

## 7. 运行时规则与坑

1. **组件名必须一致**：`new WeaponMaterial("mypack:frost_blade")` 与物品 JSON 的 `"mypack:frost_blade": {}` 完全对应。
2. **`.register()` 放顶层**：它内部订阅 `system.beforeEvents.startup`；在 startup 回调里再订阅通常来不及。
3. **`ModInitializer` 只一次**：重复 `new` 会抛 `OccultusSDKError`。
4. **`TaskServer` 自动提交不计数**：事件触发即完成，数量条件会被忽略，且是“任一条件满足”。
5. **击杀条件必须 `pushToServer`**：否则 `check()` 永远返回 `false`。
6. **`JobServer` 依赖 modId**：必须先 `new ModInitializer(...)`。
7. **`Toast` 需要客户端资源**（OpenToast），只装 BP 不会显示。
8. **`Database` 不在 `@occultus/api` 聚合包里**，要单独 `npm i @occultus/database`。
9. **翻译键不全**：仓库的 `lang/zh_CN.lang` 只覆盖任务/职业/鸣谢的一部分，`article.nothing.*`、`ui.artifact*`、`ui.tutorial.unlock`、`skill.cooldown`、`task.locked*` 等需要自己补。
10. **API 版本要匹配**：这是 API Level 13.1，要求 Script API v2.0.0+（1.21.90+），仓库标注 1.21.110。
11. **性能**：`VirtualEffect.updateTick`、`BossServer` 的技能 interval、`Database` 的同步间隔都会常驻跑，实体多时要调大间隔。
12. **`@occultus/ui` 目前是空壳**：UI 能力分散在各模块自带的 Form 里，不要指望它提供通用 UI 组件。

---

## 8. 它适合 / 不适合做什么

**适合：**

- 想做一套“任务书 + 职业 + Boss + 图鉴”的 RPG 向附加包；
- 已经会写基岩版 Script API，但不想重复造任务/职业/条件/奖励的轮子；
- 需要把复杂逻辑拆成 TypeScript 模块，用 esbuild 打包；
- 想做和《磐石之旅》同类的、以“系统”而非“单个物品”为核心的附加包。

**不适合：**

- 想直接把这个文件夹丢进游戏就能玩（它不是资源包/行为包）；
- 完全不想碰 Node.js、TypeScript、打包工具；
- 只做几个简单物品/方块，原版数据驱动就够了，引入框架反而更重；
- 需要大量自定义 UI 控件（它主要基于 ActionForm/ModalForm）。

---

## 9. 参考

- 仓库：`https://codeberg.org/TeamOccultus/StarTenonAPI`
- Core：`https://codeberg.org/TeamOccultus/OccultusCore`
- npm：`@occultus/core`、`@occultus/api` 及各子包
- 协议：MIT

> 本文的安装/打包步骤在容器内用 `@occultus/core@1.1.0` + `@occultus/api@0.31.0-alpha` + esbuild 验证过；
> 代码片段是用法示例，未在真实存档中逐条跑通，落地时请以实际游戏版本和类型提示为准。
