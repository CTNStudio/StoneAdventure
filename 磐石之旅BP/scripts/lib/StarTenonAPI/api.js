/*
 * Occultus SDK · Star Tenon API（npm 包 @occultus/api）v0.31.0
 *
 * 作者 / Author   : CTN Studios（贡献者 / contributor: FangLimao）
 * 协议 / License  : MIT License — Copyright © 2025 CTN Studios
 * 来源 / Source   : https://codeberg.org/TeamOccultus/StarTenonAPI
 *
 * 本文件为原作者发布的预编译产物（仓库路径 starock/script/api.js），
 * 未做任何逻辑修改，仅在本行以上添加了版权与协议标注（MIT 要求保留版权声明）。
 * 完整许可文本见同目录 LICENSE。
 */
// src/apiVer.ts
var StarTenon = class {
  constructor() {
  }
  /**
   * Star Tenon API 版本级别
   *
   * - 1：基础 API
   * - 2：添加了教程 API
   * - 3：优化了大部分 API 接口依赖的版本
   * - 4：完善了任务 API 的条件与奖励、加入了 `Localization` 类
   * - 5：加入了模拟效果 API
   * - 6：加入了职业 API
   *   - 6.1：工具集的一些优化与改进
   *   - 6.2：`ensureNamespace`与`ensureNoNamespace`函数与漏洞修复
   * - 7：加入了 Credits API
   *   - 7.1：新的工具集函数
   *   - 7.2：职业 API 的改进
   *   - 7.3：新的工具集函数
   *   - 7.4：任务 API 某些异常行为的修复；新的工具集函数
   *   - 7.5：Time API 的改进
   * - 8：加入了 Logue API
   *   - 8.1：教程 API 的改进
   * - 9：对 1.1.0 Core 的适配，页面跳转的改进
   * - 10：加入了 Server Binding API
   *   - 10.1：新的工具集函数，BlockEntity 的 API 行为变化
   * - 11：教程 API 的改进，单独的依赖库文件的提供
   * - 12：加入了 Toast API
   *   - 12.1：新的工具集函数（颜色相关）
   */
  static apiLevel = 12.1;
  /**
   * Star Tenon API 对应的版本号
   */
  static version = `0.31.0 (API: ${this.apiLevel})`;
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/error/SDKError.ts
var OccultusSDKError = class extends Error {
  /**
   * @param message 错误消息
   * @param from 错误的来源
   */
  constructor(message, from) {
    if (!message) {
      message = "Occultus SDK \u51FA\u73B0\u4E86\u672A\u77E5\u9519\u8BEF\uFF01";
    }
    const parsed = `FROM ${from || "UNKNOWN"}: ${message}`;
    super(parsed);
    this.name = "Occultus SDK Error";
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/ModInitializer.ts
import { system } from "@minecraft/server";

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/ModManager.ts
var ModManager = class {
  constructor() {
  }
  /**
   * 当前脚本环境下的 Occultus SDK 初始化器
   */
  static initializer;
  /**
   * 当前脚本环境下的所有 Occultus SDK 注册表
   */
  static registries = [];
  /**
   * 根据注册表 ID 获取注册表
   * @param id 注册表的内部 ID
   * @return 内部 ID 对应的注册表
   */
  static getRegistry(id) {
    return this.registries.find((registry) => registry.id === id);
  }
  static getInitializer() {
    if (!this.initializer)
      throw new OccultusSDKError("Can't fin initializer!", "ModManager");
    return this.initializer;
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/ModInitializer.ts
var ModInitializer = class {
  /**
   * 检查传入的 ID 和版本号是否合法
   * @param id 传入的 ID
   * @param version 传入的版本号
   * @throws 如果传入了非法的 ID 或版本号，或者重复声明会抛出错误
   */
  check(id, version) {
    if (ModManager.initializer) {
      throw new OccultusSDKError(
        "You have already initialized the mod\uFF01",
        "Core Initializer"
      );
    }
    if (id === "default") {
      throw new OccultusSDKError(
        "'Default' is an invaild ID\uFF01",
        "Core Initializer"
      );
    }
    if (version === "0.0.0") {
      throw new OccultusSDKError(
        "'0.0.0' is an invaild version\uFF01",
        "Core Initializer"
      );
    }
  }
  /**
   * 当脚本环境初始化后触发的事件
   */
  initEvent;
  metaData = {
    id: "default",
    name: "Default Occultus SDK Mod Name",
    version: "0.0.0"
  };
  /**
   * 为 Occultus SDK 初始化该脚本环境
   * @param id 该模组的 ID
   * @param name 该模组的名称
   * @param version 该模组的版本号
   * @throws 如果传入了非法的 ID 或版本号，或者重复声明会抛出错误
   */
  constructor(id, name, version) {
    this.check(id, version);
    if (this.initEvent) {
      system.beforeEvents.startup.subscribe((arg) => {
        this.initEvent?.(arg);
      });
    }
    this.metaData.id = id;
    this.metaData.name = name;
    this.metaData.version = version;
    ModManager.initializer = this;
    console.log(`[Occultus SDK] ${this.metaData.name} (${id}) has been already been initialized!`);
  }
  /**
   * 获取模组的名称
   * @returns 模组的名称
   */
  getModName() {
    return this.metaData.name;
  }
  /**
   * 获取模组的 ID
   * @returns 模组的 ID
   */
  getModId() {
    return this.metaData.id;
  }
  /**
   * 设置模组的名称
   * @param name 要设置的模组名称
   */
  setModName(name) {
    this.metaData.name = name;
  }
  /**
   * 设置模组版本
   * @param version 要设置的模组版本
   */
  setVersion(version) {
    this.metaData.version = version;
  }
  /**
   * 获取模组版本
   * @returns 要获取的模组版本
   */
  getVersion() {
    return this.metaData.version;
  }
  /**
   * 设置当脚本环境初始化后触发的事件
   * @param event 初始化事件回调函数
   */
  onInitialize(event) {
    this.initEvent = event;
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/base/Registries.ts
var Registries = class {
  constructor() {
    ModManager.registries.push(this);
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/ModMessage.ts
import {
  system as system2
} from "@minecraft/server";
var ModMessageServer = class {
  messages = /* @__PURE__ */ new Map();
  initServer() {
    system2.afterEvents.scriptEventReceive.subscribe((event) => {
      if (!this.messages.has(event.id)) return;
      this.messages.get(event.id)?.call(this, event);
    });
  }
  constructor() {
    this.initServer();
  }
  /**
   * 定义一条模组消息
   * @param message 消息名称
   * @param callback 接收到消息后的回调函数
   */
  defineMessage(message, callback) {
    this.messages.set(message, callback);
  }
  /**
   * 向全局发送一条模组消息
   * @param message 消息名称
   * @param data 额外的数据
   */
  postMessage(message, data) {
    system2.sendScriptEvent(`${message}`, data);
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/api/base/FormLike.ts
var FormLike = class {
  /**
   * 处理表单关闭后的返回逻辑，跳转到上一级表单
   * @param player 要处理返回逻辑的玩家
   * @param backTo 只读的表单返回栈，避免原数组被篡改
   */
  quit(player, backTo) {
    if (backTo.length === 0) {
      return;
    }
    const [prevForm, ...newBackStack] = backTo;
    prevForm.display(player, newBackStack);
  }
  /**
   * 统一的表单跳转方法，子类跳转新表单时请调用此方法
   *
   * @param player 要跳转表单的玩家
   * @param form 要跳转到的目标表单实例
   * @param backTo 当前的只读返回栈，直接透传display方法的backTo参数即可
   */
  jumpTo(player, form, backTo) {
    const newBackStack = [this, ...backTo];
    form.display(player, newBackStack);
  }
};

// ../node_modules/.pnpm/@occultus+core@1.1.0_@minec_cddd9d27654ecc6961f34ac46dfd0b14/node_modules/@occultus/core/src/coreVer.ts
var OccultusCore = class {
  constructor() {
  }
  /**
   * Occultus Core 的版本号
   */
  static version = `1.0.0`;
};

// ../packages/common/src/lib/EffectList.ts
var neutralEffectsId = [
  "bad_omen",
  "trial_omen",
  "raid_omen"
];
var negativeEffectsId = [
  "slowness",
  "mining_fatigue",
  "instant_damage",
  "nausea",
  "blindness",
  "hunger",
  "weakness",
  "poison",
  "wither",
  "fatal_poison",
  "levitation",
  "darkness",
  "wind_charged",
  "weaving",
  "oozing",
  "infested"
];
var positiveEffectsId = [
  "speed",
  "haste",
  "strength",
  "instant_health",
  "regeneration",
  "jump_boost",
  "invisibility",
  "water_breathing",
  "health_boost",
  "night_vision",
  "saturation",
  "absorption",
  "village_hero",
  "conduit_power",
  "slow_falling"
];

// ../packages/common/src/lib/EffectGroup.ts
var EffectGroups = /* @__PURE__ */ ((EffectGroups4) => {
  EffectGroups4["Good"] = "GOOD";
  EffectGroups4["Bad"] = "BAD";
  EffectGroups4["Neutral"] = "NEUTRAL";
  EffectGroups4["All"] = "ALL";
  return EffectGroups4;
})(EffectGroups || {});
var effectGroupMap = {
  ["ALL" /* All */]: [...positiveEffectsId, ...negativeEffectsId],
  ["BAD" /* Bad */]: negativeEffectsId,
  ["GOOD" /* Good */]: positiveEffectsId,
  ["NEUTRAL" /* Neutral */]: neutralEffectsId
};

// ../packages/time/src/api/Time.ts
import { MoonPhase, world } from "@minecraft/server";

// ../packages/time/src/enums/TimeSpec.ts
var TimeSpec = /* @__PURE__ */ ((TimeSpec2) => {
  TimeSpec2[TimeSpec2["Morning"] = 0] = "Morning";
  TimeSpec2[TimeSpec2["Noon"] = 1] = "Noon";
  TimeSpec2[TimeSpec2["Sunset"] = 2] = "Sunset";
  TimeSpec2[TimeSpec2["Night"] = 3] = "Night";
  TimeSpec2[TimeSpec2["Sunrise"] = 4] = "Sunrise";
  return TimeSpec2;
})(TimeSpec || {});

// ../packages/time/src/api/Time.ts
var Time = class _Time {
  /**
   * 获取当前计算机时间，这将会返回一个 GMT 0000 时区的时间
   * @returns
   */
  static getComputerTime() {
    return /* @__PURE__ */ new Date();
  }
  /**
   * 获取不同时区的计算机时间
   * @param i 从标准时间开始增加或减少的小时数
   * @example
   * console.log("标准时间："+ Time.getComputerTime());
   * console.log("北京时间（UTC +8）：" + Time.getLocalTime(8));
   * console.log("美国太平洋标准时间：" + Time.getLocalTime(-8));
   */
  static getLocalTime(i) {
    const d = /* @__PURE__ */ new Date();
    const len = d.getTime();
    const offset = d.getTimezoneOffset() * 6e4;
    const utcTime = len + offset;
    return new Date(utcTime + 36e5 * i);
  }
  /**
   * 获取当前游戏时间
   * @returns 当前游戏时间
   */
  static getGameTime() {
    return world.getTimeOfDay();
  }
  /**
   * 获取当前游戏时间段
   * @returns 游戏时间段枚举值，可能的返回值包括：
   *
   *  - TimeSpec.MORNING: 早晨时间段
   *  - TimeSpec.NOON: 中午时间段
   *  - TimeSpec.SUNSET: 日落时间段
   *  - TimeSpec.NIGHT: 夜晚时间段
   *  - TimeSpec.SUNRISE: 日出时间段
   *
   * @throws 如果无法解析时间，则抛出错误，错误信息包含当前时间值。
   */
  static getGameTimeSpec() {
    const time = _Time.getGameTime();
    if (time < 6e3) return 0 /* Morning */;
    if (time >= 6e3 && time < 11e3) return 1 /* Noon */;
    if (time >= 11e3 && time < 13800) return 2 /* Sunset */;
    if (time >= 13800 && time < 22200) return 3 /* Night */;
    if (time >= 22200) return 4 /* Sunrise */;
    throw new OccultusSDKError(
      "Failed to parse time! Get time:" + time,
      "Time Parser"
    );
  }
  /**
   * 获取当前月亮亮度，返回值范围在 `[0, 1]` 之间
   * @returns 
   */
  static getMoonBrightness() {
    const phase = world.getMoonPhase();
    if (phase === MoonPhase.FullMoon) return 1;
    if (phase === MoonPhase.WaningGibbous || phase === MoonPhase.WaxingGibbous)
      return 0.75;
    if (phase === MoonPhase.FirstQuarter || phase === MoonPhase.LastQuarter)
      return 0.5;
    if (phase === MoonPhase.WaxingCrescent || phase === MoonPhase.WaningCrescent)
      return 0.25;
    if (phase === MoonPhase.NewMoon) return 0;
    return 0;
  }
};

// ../packages/time/src/api/Tick.ts
import { TicksPerSecond } from "@minecraft/server";
var Tick = class {
  /**
   * 将游戏刻转换为秒
   * @param tick 要转换的游戏刻
   * @return 转换后的秒数
   */
  static toSecond(tick) {
    return tick / TicksPerSecond;
  }
};

// ../packages/time/src/api/Second.ts
import { TicksPerSecond as TicksPerSecond2 } from "@minecraft/server";
var Second = class {
  /**
   * 将秒转换为游戏刻
   * @param tick 要转换的秒数
   * @return 转换后的游戏刻
   */
  static toTick(seconds) {
    return seconds * TicksPerSecond2;
  }
};

// ../packages/text/src/lib/parser.ts
function parseText(text, player) {
  if (typeof text === "function") {
    return text(player);
  }
  return text;
}
function parseToRaw(text, player) {
  const parsed = parseText(text, player);
  if (typeof parsed === "string") {
    return { text: parsed };
  }
  return parsed;
}
function simpleToRaw(str) {
  if (typeof str === "string") {
    return { text: str };
  }
  return str;
}
function parseToRomanNumber(num) {
  const romanMap = [
    { value: 1e3, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" }
  ];
  let result = "";
  for (const { value, symbol } of romanMap) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}
function toOneLine(str) {
  if (!str.includes("%")) return str;
  return str.split("%")[1].replaceAll("\n", "");
}

// ../packages/text/src/data/effectTranslates.ts
var effectTranslates = {
  "minecraft:absorption": "potion.absorption",
  "minecraft:blindness": "potion.blindness",
  "minecraft:conduit_power": "potion.conduitPower",
  "minecraft:nausea": "potion.confusion",
  "minecraft:strength": "potion.damageBoost",
  "minecraft:mining_fatigue": "potion.digSlowDown",
  "minecraft:haste": "potion.digSpeed",
  "minecraft:fire_resistance": "potion.fireResistance",
  "minecraft:instant_damage": "potion.harm",
  "minecraft:instant_health": "potion.heal",
  "minecraft:health_boost": "potion.healthBoost",
  "minecraft:hunger": "potion.hunger",
  "minecraft:infested": "potion.infested",
  "minecraft:invisibility": "potion.invisibility",
  "minecraft:jump_boost": "potion.jump",
  "minecraft:levitation": "potion.levitation",
  "minecraft:slowness": "potion.moveSlowdown",
  "minecraft:slow_falling": "potion.slowFalling",
  "minecraft:speed": "potion.moveSpeed",
  "minecraft:night_vision": "potion.nightVision",
  "minecraft:oozing": "potion.oozing",
  "minecraft:poison": "potion.poison",
  "minecraft:regeneration": "potion.regeneration",
  "minecraft:resistance": "potion.resistance",
  "minecraft:saturation": "potion.saturation",
  "minecraft:turtle_master": "potion.turtleMaster",
  "minecraft:water_breathing": "potion.waterBreathing",
  "minecraft:weakness": "potion.weakness",
  "minecraft:weaving": "potion.weaving",
  "minecraft:wind_charged": "potion.windCharged",
  "minecraft:wither": "potion.wither"
};

// ../packages/text/src/api/TranslateProvider.ts
var TranslateProvider = class {
  /**
   * 从物品获取本地化字符串
   * @param itemId
   * @returns
   */
  static fromItem(itemId) {
    return "item." + itemId;
  }
  /**
   * 从方块获取本地化字符串
   * @param blockId
   * @returns
   */
  static fromBlock(blockId) {
    return "tile." + blockId + ".name";
  }
  /**
   * 从状态效果获取本地化字符串
   * @param effectId 状态效果的 ID
   * @return 状态效果对应的本地化字符串
   */
  static fromEffect(effectId) {
    if (effectTranslates[effectId]) return effectTranslates[effectId];
    return "potion." + effectId;
  }
  static ok = "gui.ok";
  static cancel = "gui.cancel";
};

// ../packages/format/src/api/Color.ts
var Color = class {
  constructor() {
  }
  /**
   * 将文本颜色设置为黑色
   */
  static black = "\xA70";
  /**
   * 将文本颜色设置为深蓝色
   */
  static darkBlue = "\xA71";
  /**
   * 将文本颜色设置为深绿色
   */
  static darkGreen = "\xA72";
  /**
   * 将文本颜色设置为湖蓝色
   */
  static darkAqua = "\xA73";
  /**
   * 将文本颜色设置为深红色
   */
  static darkRed = "\xA74";
  /**
   * 将文本颜色设置为深紫色
   */
  static darkPurple = "\xA75";
  /**
   * 将文本颜色设置为金色
   */
  static gold = "\xA76";
  /**
   * 将文本颜色设置为灰色
   */
  static gray = "\xA77";
  /**
   * 将文本颜色设置为深灰色
   */
  static darkGray = "\xA78";
  /**
   * 将文本颜色设置为蓝色
   */
  static blue = "\xA79";
  /**
   * 将文本颜色设置为绿色
   */
  static green = "\xA7a";
  /**
   * 将文本颜色设置为天蓝色
   */
  static aqua = "\xA7b";
  /**
   * 将文本颜色设置为红色
   */
  static red = "\xA7c";
  /**
   * 将文本颜色设置为浅紫色
   */
  static lightPurple = "\xA7d";
  /**
   * 将文本颜色设置为黄色
   */
  static yellow = "\xA7e";
  /**
   * 将文本颜色设置为白色
   */
  static white = "\xA7f";
  /**
   * 将文本颜色设置为硬币金色
   *
   * 该颜色在PlayStation上无法正常显示，会显示为无格式或透明。
   */
  static minecoinGold = "\xA7g";
  /**
   * 将文本颜色设置为石英色
   */
  static materialQuartz = "\xA7h";
  /**
   * 将文本颜色设置为铁灰色
   */
  static materialIron = "\xA7i";
  /**
   * 将文本颜色设置为下界合金灰色
   */
  static materialNetherite = "\xA7j";
  /**
   * 将文本颜色设置为红石色
   */
  static materialRedstone = "\xA7m";
  /**
   * 将文本颜色设置为铜橙色
   */
  static materialCopper = "\xA7n";
  /**
   * 将文本颜色设置为金色
   */
  static materialGold = "\xA7p";
  /**
   * 将文本颜色设置为绿宝石色
   */
  static materialEmerald = "\xA7q";
  /**
   * 将文本颜色设置为钻石色
   */
  static materialDiamond = "\xA7s";
  /**
   * 将文本颜色设置为青金石色
   */
  static materialLapis = "\xA7t";
  /**
   * 将文本颜色设置为水晶紫色
   */
  static materialAmethyst = "\xA7u";
  /**
   * 将文本颜色设置为树脂橙色
   */
  static materialResin = "\xA7v";
};

// ../packages/format/src/api/Format.ts
var Format = class {
  constructor() {
  }
  /**
   * 将文本格式设置为 **加粗**
   */
  static bold = "\xA7l";
  /**
   * 将文本格式设置为 *斜体*
   */
  static italics = "\xA7o";
  /**
   * 将文本格式设置为带有下划线
   * @deprecated 由于 Mojang 自身原因，游戏中下划线文本无法正常格式化
   */
  static underline = "\xA7n";
  /**
   * 将文本格式设置为 ~~带有删除线~~
   * @deprecated 由于 Mojang 自身原因，游戏中删除线文本无法正常格式化
   */
  static strikeThrough = "\xA7m";
  /**
   * 将文本格式设置为随机字符
   *
   * 字体不为 Mojangles 时，会显示为`.......`
   */
  static random = "\xA7k";
  /**
   * 重置所有文本颜色和格式
   */
  static reset = "\xA7r";
  /**
   * 换行
   */
  static newLine = "\n";
  /**
   * 创建数个空白行
   * @param count 空白行的数量
   * @return 一个包含空白行的字符串
   */
  static blankLine(count = 1) {
    const arr = ["\n"];
    for (let i = 0; i < count; i++) {
      arr.push("\n");
    }
    return arr.join("");
  }
};

// ../packages/format/src/api/Localization.ts
var Localization = class {
  constructor() {
  }
  static getEntityKey(namespacedId) {
    return "entity." + namespacedId + ".name";
  }
  static getItemKey(namespacedId, legacy = false) {
    if (!legacy) return "item." + namespacedId;
    return "item." + namespacedId + ".name";
  }
  static getBlockKey(namespacedId) {
    return "tile." + namespacedId + ".name";
  }
};

// ../packages/entity/src/api/BlockEntity.ts
import { ItemStack, world as world2 } from "@minecraft/server";
var BlockEntity = class {
  constructor() {
  }
  /**
   * 从一个方块实体获取实体数据
   * @param entity 要获取数据的方块实体
   * @returns
   */
  static getData(entity) {
    const block = entity.dimension.getBlock(entity.location);
    if (!block) return;
    const data = {
      dimension: entity.dimension,
      entity,
      location: entity.location,
      block,
      scoreboardObjective: world2.scoreboard.getObjective(
        `${entity.typeId}:${entity.id}`
      )
    };
    return data;
  }
  /**
   * 存储物品到方块实体数据中
   *
   * @param items 要存储的物品，可以是单个物品或物品数组
   * @param data 用于存储物品的方块实体数据
   */
  static storeItem(items, data) {
    if (Array.isArray(items)) {
      this.storeWithContainer(data, items);
      return;
    }
    if (data.entity.hasComponent("inventory")) {
      this.storeWithContainer(data, items);
      return;
    }
    this.storeWithDynamicProperty(data, items);
  }
  /**
   * 摧毁方块实体数据，这会将其中存储的物品掉落在世界中
   * 
   * **IMPORTANT: 倘若方块实体采用了原版组件方式储存物品，则被存储物品的掉落逻辑将会由原版游戏接管**
   * @param data
   */
  static destory(data) {
    const item = this.getStoredItem(data);
    if (data.block.getComponent("inventory")) {
      this.remove(data);
      return;
    }
    if (!item) {
      this.remove(data);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach((i) => {
        data.dimension.spawnItem(i, data.entity.location);
      });
    } else {
      data.dimension.spawnItem(item, data.entity.location);
    }
    this.remove(data);
  }
  /**
   * 直接移除方块实体数据
   * @param data
   */
  static remove(data) {
    if (data.scoreboardObjective)
      world2.scoreboard.removeObjective(data.scoreboardObjective);
    data.entity?.remove();
  }
  /**
   * 清除方块实体所存储的物品
   * @param data
   */
  static clearStoredItem(data) {
    if (data.entity.hasComponent("inventory")) {
      const container = data.entity.getComponent("inventory")?.container;
      if (!container) return;
      container.clearAll();
      return;
    } else {
      data.entity.setDynamicProperty("starock:storedItem");
    }
  }
  /**
   * 获取方块实体存储的物品
   * @param data
   * @returns 方块实体存储的物品
   */
  static getStoredItem(data) {
    if (data.entity.hasComponent("inventory")) {
      const container = data.entity.getComponent("inventory")?.container;
      if (!container) return [];
      const items = [];
      for (let i = 0; i < container.size; i++) {
        const item2 = container.getItem(i);
        if (item2) {
          items.push(item2);
        }
      }
      return items;
    }
    const rawData = data.entity.getDynamicProperty("starock:storedItem");
    if (typeof rawData !== "string") return [];
    const itemData = JSON.parse(rawData);
    const item = new ItemStack(itemData.typeId, itemData.amount);
    if (!item.hasComponent("durability")) return [item];
    if (!itemData.damage) return [item];
    item.getComponent("durability").damage = itemData.damage;
    return [item];
  }
  static storeWithContainer(data, item) {
    const container = data.entity.getComponent("inventory")?.container;
    if (!container) return;
    if (Array.isArray(item)) {
      item.forEach((item2) => {
        container.addItem(item2);
      });
    } else {
      container.addItem(item);
    }
  }
  static storeWithDynamicProperty(data, item) {
    const itemData = {
      typeId: item.typeId,
      amount: item.amount,
      damage: item.getComponent("durability")?.damage
    };
    data.entity.setDynamicProperty(
      "starock:storedItem",
      JSON.stringify(itemData)
    );
    console.log(JSON.stringify(itemData));
  }
  /**
   * 将方块实体同步到其应该在的位置
   * @param data
   */
  synchronize(data) {
    const { location, entity } = data;
    const correctLocation = entity.getDynamicProperty(
      "starock:blockEntityLocation"
    );
    if (equals(location, correctLocation)) return;
    entity.teleport(correctLocation);
  }
};
function equals(location, correctLocation) {
  return location.x === correctLocation.x && location.y === correctLocation.y && location.z === correctLocation.z;
}

// ../packages/entity/src/api/BlockWithEntity.ts
import {
  system as system3,
  world as world3
} from "@minecraft/server";
var BlockWithEntity = class {
  /**
   * @param blockId 方块的 ID
   * @param entityId 方块实体的 ID
   */
  constructor(blockId, entityId, tickEventName) {
    this.blockId = blockId;
    this.entityId = entityId;
    this.tickEventName = tickEventName;
    this.eventListener();
  }
  eventListener() {
    world3.afterEvents.playerPlaceBlock.subscribe((arg) => {
      if (arg.block.typeId === this.blockId) {
        this.placeEntity(arg.dimension, arg.block.location);
      }
    });
    world3.beforeEvents.playerBreakBlock.subscribe((arg) => {
      if (arg.block.typeId === this.blockId) {
        const data = this.getBlockEntityData(arg.block);
        system3.run(() => {
          if (data) BlockEntity.destory(data);
        });
      }
    });
    world3.afterEvents.playerInteractWithBlock.subscribe((arg) => {
      if (arg.block.typeId === this.blockId) {
        this.onInteract(arg);
      }
    });
    if (this.tickEventName) {
      world3.afterEvents.dataDrivenEntityTrigger.subscribe((arg) => {
        if (arg.entity.typeId === this.entityId && arg.eventId === this.tickEventName) {
          this.onTick(arg);
        }
      });
    }
  }
  /**
   * 获取方块实体的数据
   * @param block 要获取方块实体的方块
   * @returns 获取到的方块实体
   */
  getBlockEntityData(block) {
    const { dimension, location } = block;
    const entity = dimension.getEntities({
      location,
      type: this.entityId
    })[0];
    return BlockEntity.getData(entity);
  }
  /**
   * 放置一个方块实体
   * @param dimension 要放置实体的维度
   * @param location 要放置实体的位置
   * @returns
   */
  placeEntity(dimension, location) {
    const entity = dimension.spawnEntity(this.entityId, location);
    entity.setDynamicProperty("starock:blockEntityLocation", location);
    entity.setDynamicProperty("starock:blockEntityId", entity.id);
    return entity;
  }
  onInteract(_event) {
    return;
  }
  onTick(_event) {
    return;
  }
};

// ../packages/entity/src/api/ItemStackData.ts
var ItemStackData = class {
  /**
   * @param typeId 物品的 ID
   * @param amount 物品数量
   * @param damage 物品的损坏值（若有）
   */
  constructor(typeId, amount, damage) {
    this.typeId = typeId;
    this.amount = amount;
    this.damage = damage;
  }
  /**
   * 将数据转换为字符串类型以方便存储
   * @returns 字符串类型的物品堆栈数据
   */
  toString() {
    const data = {
      typeId: this.typeId,
      amount: this.amount,
      damage: this.damage
    };
    return JSON.stringify(data);
  }
};

// ../packages/entity/src/api/Boss.ts
var Boss = class {
  /**
   * @param typeId Boss 的类型 ID
   * @param skills Boss 拥有的技能
   * @param music Boss 战斗音乐相关配置
   */
  constructor(typeId, skills, music) {
    this.typeId = typeId;
    this.skills = skills;
    this.music = music;
  }
  dieEvent = () => {
  };
  /**
   * 向玩家播放 Boss 音乐
   * @param player
   */
  playMusic(player) {
    if (Array.isArray(player)) {
      for (const pl of player) {
        if (this.music) {
          pl.playMusic(this.music.trackId, { loop: true });
        }
      }
    } else if (this.music) {
      player.playMusic(this.music.trackId, { loop: true });
    }
  }
  /**
   * 执行 Boss 所有技能
   * @param boss
   */
  unleashSkill(boss) {
    for (const skill of this.skills) {
      skill.execute(boss);
    }
  }
  onDie(callback) {
    this.dieEvent = callback;
  }
};

// ../packages/skill/src/api/base/Skill.ts
var Skill = class {
  /**
   * @param id 技能的 ID
   * @param event 技能执行时的回调函数，接收执行者和目标实体数组
   * @param condition 技能执行的条件判断函数
   * @param range 技能作用范围，默认为 5
   * @param weight 技能被选中的权重，默认为 1
   */
  constructor(id, event, condition, range = 5, weight = 1) {
    this.id = id;
    this.event = event;
    this.condition = condition;
    this.range = range;
    this.weight = weight;
  }
  /**
   * 执行技能
   * @param executor - 技能的执行者实体
   */
  execute(executor) {
    const entities = executor.dimension.getEntities({
      location: executor.location,
      maxDistance: this.range
    });
    if (this.condition(executor, entities)) {
      this.event(executor, entities);
    }
  }
  /**
   * 获取技能的目标实体
   * @param executor - 技能的执行者实体
   * @returns 返回范围内的所有实体数组
   */
  getTargets(executor) {
    return executor.dimension.getEntities({
      location: executor.location,
      maxDistance: this.range
    });
  }
};

// ../packages/skill/src/api/base/SkillRegistrires.ts
import { system as system4 } from "@minecraft/server";
var SkillRegistrires = class extends Registries {
  static prefix = "starock.skill:";
  constructor() {
    super();
  }
  registry = /* @__PURE__ */ new Map();
  id = "skill";
  delete(id) {
    return this.registry.delete(id);
  }
  get(id) {
    return this.registry.get(id);
  }
  has(id) {
    return this.registry.has(id);
  }
  getAll() {
    return Array.from(this.registry.values());
  }
  /**
   * 根据技能类型获取注册表中的技能
   * @param type 技能类型
   * @return 包含对应类型技能的数组
   */
  getBySkillType(type) {
    return this.getAll().filter((x) => x.getSkillType() === type);
  }
  /**
   * 向注册表中添加技能
   * @param value
   */
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((x) => this.registry.set(x.id, x));
    } else {
      this.registry.set(value.id, value);
    }
  }
  /**
   * 对当前注册表内所有技能进行注册
   */
  register() {
    system4.beforeEvents.startup.subscribe((arg) => {
      this.registry.forEach((skill) => {
        arg.itemComponentRegistry.registerCustomComponent(skill.id, {
          onUse(arg2) {
            skill.execute(arg2.source);
          }
        });
      });
    });
  }
};

// ../packages/skill/src/api/ItemSkill.ts
var ItemSkill = class extends Skill {
  /**
   * @param id 技能的唯一标识符
   * @param event 技能执行时的回调函数，定义技能的具体行为
   * @param condition 技能执行前的条件判断函数，返回布尔值决定是否可以执行
   * @param range 技能的有效范围，默认为 5
   */
  constructor(id, event, condition, range = 5) {
    super(id, event, condition, range);
    this.id = id;
    this.event = event;
    this.condition = condition;
    this.range = range;
    if (!this.condition) this.condition = () => true;
  }
  /**
   * 获取技能类型
   */
  getSkillType() {
    return "Item";
  }
  /**
   * 将技能添加到指定物品上
   * @param item 要添加技能的物品实例
   */
  addToItem(item) {
    item.setDynamicProperty(`${SkillRegistrires.prefix}:${this.id}`, true);
  }
  /**
   * 从物品上移除技能
   * @param item 要移除技能的物品实例
   */
  removeFromItem(item) {
    item.setDynamicProperty(`${SkillRegistrires.prefix}:${this.id}`, false);
  }
  /**
   * 检查物品是否拥有该技能
   * @param item 要检查的物品实例
   * @returns 返回布尔值，表示物品是否拥有该技能
   */
  owned(item) {
    return item.getDynamicProperty(
      `${SkillRegistrires.prefix}:${this.id}`
    );
  }
};
var ItemUseSkill = class extends ItemSkill {
  /**
   * @param id 技能的 ID
   * @param event 技能执行时的回调函数，接收执行者和目标作为参数
   * @param condition 判断技能是否可以执行的条件函数，接收执行者和目标作为参数
   * @param range 技能的作用范围，默认值为5
   */
  constructor(id, event, condition, range = 5) {
    super(id, event, condition, range);
    this.id = id;
    this.event = event;
    this.condition = condition;
    this.range = range;
    if (!this.condition) this.condition = () => true;
  }
  /**
   * 获取技能类型
   */
  getSkillType() {
    return "ItemUse";
  }
};
var ItemAtkSkill = class extends ItemSkill {
  /**
   * @param id 技能的唯一标识符
   * @param event 技能执行时的回调函数，接收执行者和目标实体作为参数
   * @param condition 技能执行的条件判断函数，返回布尔值表示是否满足条件
   * @param range 技能的有效作用范围，默认值为 5
   */
  constructor(id, event, condition, range = 5) {
    super(id, event, condition, range);
    this.id = id;
    this.event = event;
    this.condition = condition;
    this.range = range;
    if (!this.condition) this.condition = () => true;
  }
  /**
   * 获取技能的类型标识
   */
  getSkillType() {
    return "ItemAtk";
  }
};

// ../packages/skill/src/api/PlayerSkill.ts
var PlayerSkill = class extends Skill {
  /**
   * @param id 技能的 ID
   * @param event 技能执行时的回调函数，接收执行者和目标实体作为参数
   * @param condition 技能执行条件的判断函数，接收执行者和目标实体作为参数，返回是否满足条件
   * @param range 技能的有效范围，默认值为 5
   */
  constructor(id, event, condition, range = 5) {
    super(id, event, condition, range);
    this.id = id;
    this.event = event;
    this.condition = condition;
    this.range = range;
    if (!this.condition) this.condition = () => true;
  }
  /**
   * 获取技能类型
   */
  getSkillType() {
    return "Player";
  }
};

// ../packages/entity/src/api/BossSkill.ts
var BossSkill = class extends Skill {
  constructor(id, cooldownTime, event, radius) {
    super(id, event, () => true);
    this.id = id;
    this.cooldownTime = cooldownTime;
    this.event = event;
    this.radius = radius;
  }
  getSkillType() {
    return "bossSkill";
  }
};

// ../packages/entity/src/api/base/BossServer.ts
import { Player, system as system5, world as world4 } from "@minecraft/server";
var BossServer = class {
  boss = /* @__PURE__ */ new Map();
  registriesBoss(entity) {
    if (!this.boss.get(entity.typeId)) return;
    const boss = this.boss.get(entity.typeId);
    entity.setDynamicProperty("occultus:start_skill", true);
    for (const skill of boss.skills) {
      const handle = system5.runInterval(() => {
        skill.execute(entity);
      }, skill.cooldownTime);
      world4.afterEvents.entityDie.subscribe((event) => {
        if (event.deadEntity.id === entity.id) {
          system5.clearRun(handle);
        }
      });
      world4.afterEvents.entityRemove.subscribe((event) => {
        if (event.removedEntityId === entity.id) {
          system5.clearRun(handle);
        }
      });
    }
  }
  registriesMusic(entity) {
    if (!this.boss.get(entity.typeId)) return;
    const boss = this.boss.get(entity.typeId);
    if (!boss.music) return;
    const music = boss.music;
    const players = [];
    for (const aroundEntity of entity.dimension.getEntities({
      location: entity.location,
      minDistance: 0,
      maxDistance: music.radius
    })) {
      if (aroundEntity instanceof Player) {
        aroundEntity.playMusic(music.trackId, { loop: true });
        players.push(aroundEntity);
      }
    }
    world4.afterEvents.entityDie.subscribe((event) => {
      if (event.deadEntity.id === entity.id) {
        for (const player of players) {
          player.stopMusic();
        }
      }
    });
    world4.afterEvents.entityRemove.subscribe((event) => {
      if (event.removedEntityId === entity.id) {
        for (const player of players) {
          player.stopMusic();
        }
      }
    });
  }
  startUp() {
    world4.afterEvents.entityDie.subscribe((event) => {
      const { deadEntity } = event;
      if (this.boss.has(deadEntity.typeId)) {
        const boss = this.boss.get(deadEntity.typeId);
        if (boss?.dieEvent) {
          boss.dieEvent(event);
          return;
        }
      }
    });
    world4.afterEvents.entitySpawn.subscribe((event) => {
      const entity = event.entity;
      this.registriesBoss(entity);
      this.registriesMusic(entity);
    });
    world4.afterEvents.entityLoad.subscribe((event) => {
      const entity = event.entity;
      this.registriesBoss(entity);
      this.registriesMusic(entity);
    });
  }
  constructor() {
    this.startUp();
  }
  addBoss(boss) {
    this.boss.set(boss.typeId, boss);
  }
};

// ../packages/item/src/api/Tool.ts
var ToolMaterial = class {
  /**
   * @param name 工具材料的名称，这个名称将被注册为自定义组件
   * @param builtinSkills 工具内建的技能，其中 {@link ItemUseSkill} 仅在开启了 {@link ToolMaterial.enableUseEvents} 时可用
   * @param enableUseEvents 是否启用工具使用事件
   */
  constructor(name, builtinSkills = [], enableUseEvents = false) {
    this.name = name;
    this.builtinSkills = builtinSkills;
    this.enableUseEvents = enableUseEvents;
  }
  /**
   * 设置工具击打实体时的事件
   */
  onHitEntity = () => {
  };
  /**
   * 设置工具挖掘方块时的事件
   */
  onMineBlock = () => {
  };
  /**
   * 设置工具使用时的事件
   *
   * **IMPORTANT: 该事件仅在工具开启了 {@link ToolMaterial.enableUseEvents} 时可用**
   */
  onUse = () => {
  };
  /**
   * 设置工具使用在方块上时的事件
   *
   * **IMPORTANT: 该事件仅在工具开启了 {@link ToolMaterial.enableUseEvents} 时可用**
   */
  onUseOn = () => {
  };
  /**
   * 获取工具所有技能
   */
  getAllSkills(item, registry) {
    const skills = [];
    item.getDynamicPropertyIds().forEach((id) => {
      if (!id.startsWith(SkillRegistrires.prefix)) return;
      if (item.getDynamicProperty(id) !== true) return;
      if (registry.get(id)) skills.push(registry.get(id));
    });
    return skills.concat(this.builtinSkills);
  }
};

// ../packages/item/src/api/Weapon.ts
var WeaponMaterial = class {
  /**
   * @param name 武器材料的名称，这个名称将被注册为自定义组件
   * @param builtinSkills 武器内建的技能，其中 {@link ItemUseSkill} 仅在开启了 {@link ToolMaterial.enableUseEvents} 时可用
   * @param enableUseEvents 是否启用武器使用事件
   */
  constructor(name, builtinSkills = [], enableUseEvents = false) {
    this.name = name;
    this.builtinSkills = builtinSkills;
    this.enableUseEvents = enableUseEvents;
  }
  onHitEntity = () => {
  };
  onMineBlock = () => {
  };
  /**
   * 武器使用事件
   *
   * **IMPORTANT: 该事件仅在武器开启了 {@link WeaponMaterial.enableUseEvents} 时可用**
   */
  onUse = () => {
  };
  getAllSkills(item, registry) {
    const skills = [];
    item.getDynamicPropertyIds().forEach((id) => {
      if (!id.startsWith(SkillRegistrires.prefix)) return;
      if (item.getDynamicProperty(id) !== true) return;
      if (registry.get(id)) skills.push(registry.get(id));
    });
    return skills.concat(this.builtinSkills);
  }
};

// ../packages/item/src/api/Food.ts
var FoodMaterial = class {
  /**
   * @param name 食物材料的名称，这个名称将被注册为自定义组件
   */
  constructor(name) {
    this.name = name;
  }
  /**
   * 食物被消耗时触发的事件
   */
  onConsume = () => {
  };
};

// ../packages/random/src/api/Random.ts
var Random = class {
  /**
   * 生成随机整数。如果 max > min，会产生未定义的结果
   * @param max 最大值（包含），小数部分将被向下取整
   * @param min 最小值（包含），小数部分将被向下取整，默认为0
   * @return 在最小值和最大值之间的一个随机整数
   */
  static integer(max, min = 0) {
    max = Math.floor(max);
    min = Math.floor(min);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  /**
   * 生成随机小数。如果 max > min，会产生未定义的结果
   * 注：因为 Math.random() 生成的是 [0,1) 的小数，所以很难做到理论上完美。但是够用
   * @param max 最大值（不包含）
   * @param min 最小值（包含），默认为0
   * @return 在最小值和最大值之间的一个随机小数
   */
  static decimal(max, min = 0) {
    return Math.random() * (max - min) + min;
  }
  /**
   * 生成一个 UUID (version 4)
   * 按照 RFC 9562 实现。https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-4
   * @return 一个字符串形式的 UUID。
   */
  static UUID() {
    let result = "";
    for (let i = 0; i < 16; i++) {
      let randomByte = Math.floor(Math.random() * 256);
      if (i == 6) randomByte = randomByte & 15 | 64;
      else if (i == 8) randomByte = randomByte & 63 | 128;
      result += randomByte.toString(16).padStart(2, "0");
      if (i == 3 || i == 5 || i == 7 || i == 9) {
        result += "-";
      }
    }
    return result;
  }
};

// ../packages/math/src/api/Vector3Utils.ts
var Vector3Utils = class _Vector3Utils {
  /**
   * 比较两个三维向量是否相等
   *
   * @param vector1 第一个三维向量。
   * @param vector2 第二个三维向量。
   * @returns 如果两个三维向量都相等，返回`true`，否则返回`false`
   */
  static equals(vector1, vector2) {
    return vector1.x === vector2.x && vector1.y === vector2.y && vector1.z === vector2.z;
  }
  /**
   * 将两个三维向量相加
   *
   * @param vector1 第一个三维向量
   * @param vector2 第二个三维向量
   * @returns 相加后的结果向量
   */
  static add(vector1, vector2) {
    return {
      x: vector1.x + (vector2.x ?? 0),
      y: vector1.y + (vector2.y ?? 0),
      z: vector1.z + (vector2.z ?? 0)
    };
  }
  /**
   * 将两个三维向量相减
   *
   * @param vector1 作被减数的三维向量
   * @param vector2 作减数的三维向量
   * @returns 相加后的结果相减
   */
  static subtract(vector1, vector2) {
    return {
      x: vector1.x - (vector2.x ?? 0),
      y: vector1.y - (vector2.y ?? 0),
      z: vector1.z - (vector2.z ?? 0)
    };
  }
  /**
   * 缩放三维向量
   *
   * @param vector 需要缩放的三维向量
   * @param scale 缩放的倍数
   * @returns 缩放后的三维向量
   */
  static scale(vector, scale) {
    return { x: vector.x * scale, y: vector.y * scale, z: vector.z * scale };
  }
  /**
   * 计算两个向量的点积
   *
   * @param vector1 第一个三维向量
   * @param vector2 第二个三维向量
   * @returns 两个向量的点积
   */
  static dot(vector1, vector2) {
    return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  }
  /**
   * 计算两个向量的叉积
   *
   * @param vector1 第一个三维向量
   * @param vector2 第二个三维向量
   * @returns 两个向量的叉积
   */
  static cross(vector1, vector2) {
    return {
      x: vector1.y * vector2.z - vector1.z * vector2.y,
      y: vector1.z * vector2.x - vector1.x * vector2.z,
      z: vector1.x * vector2.y - vector1.y * vector2.x
    };
  }
  /**
   * 计算向量的模
   * @param vector
   * @return 向量的模
   */
  static magnitude(vector) {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  }
  /**
   * 计算两个向量之间的距离
   *
   * @param vector1 第一个三维向量
   * @param vector2 第二个三维向量
   * @return 两个向量之间的距离
   */
  static distance(vector1, vector2) {
    return _Vector3Utils.magnitude(_Vector3Utils.subtract(vector1, vector2));
  }
  /**
   * 标准化一个三维向量。
   *
   * @param vector 需要被标准化的三维向量
   * @returns 标准化后的三维向量
   */
  static normalize(vector) {
    const mag = _Vector3Utils.magnitude(vector);
    return { x: vector.x / mag, y: vector.y / mag, z: vector.z / mag };
  }
  /**
   * 对向量进行向下取整
   *
   * @param vector 需要进行向下取整的三维向量
   * @return
   */
  static floor(vector) {
    return {
      x: Math.floor(vector.x),
      y: Math.floor(vector.y),
      z: Math.floor(vector.z)
    };
  }
  /**
   * 将向量转换为字符串
   *
   * @param vector 需要转换为字符串的三维向量
   * @param decimals 小数位数
   * @param delimiter 分隔符
   * @returns 转换后的字符串
   */
  static toString(vector, decimals = 2, delimiter = ", ") {
    const str = [
      vector.x.toFixed(decimals),
      vector.y.toFixed(decimals),
      vector.z.toFixed(decimals)
    ];
    return str.join(delimiter);
  }
  /**
   * 从由 {@link Vector3Utils.toString} 生成的字符串表示中获取一个三维向量，如果格式无效，则返回`undefined`
   *
   * @param str 要解析的字符串
   * @param delimiter 分隔符，默认与 {@link Vector3Utils.toString} 的默认值相同
   */
  static fromString(str, delimiter = ",") {
    const parts = str.split(delimiter);
    if (parts.length !== 3) {
      return void 0;
    }
    const output = parts.map((part) => parseFloat(part));
    if (output.some((part) => isNaN(part))) {
      return void 0;
    }
    return { x: output[0], y: output[1], z: output[2] };
  }
  /**
   * 使用线性插值从两个向量构造一个新的向量
   */
  static lerp(vector1, vector2, t) {
    return {
      x: vector1.x + (vector2.x - vector1.x) * t,
      y: vector1.y + (vector2.y - vector1.y) * t,
      z: vector1.z + (vector2.z - vector1.z) * t
    };
  }
  /**
   * 使用球面线性插值从两个向量构造一个新的向量
   */
  static slerp(vector1, vector2, t) {
    const theta = Math.acos(_Vector3Utils.dot(vector1, vector2));
    const sinTheta = Math.sin(theta);
    const ta = Math.sin((1 - t) * theta) / sinTheta;
    const tb = Math.sin(t * theta) / sinTheta;
    return _Vector3Utils.add(
      _Vector3Utils.scale(vector1, ta),
      _Vector3Utils.scale(vector2, tb)
    );
  }
  /**
   * 对两个向量进行逐元素相乘
   */
  static multiply(vector1, vector2) {
    return {
      x: vector1.x * vector2.x,
      y: vector1.y * vector2.y,
      z: vector1.z * vector2.z
    };
  }
  /**
   * 围绕 X 轴逆时针旋转向量（左手法则）
   * @param angle 以弧度表示的角度
   */
  static rotateX(vector, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vector.x,
      y: vector.y * cos - vector.z * sin,
      z: vector.z * cos + vector.y * sin
    };
  }
  /**
   * 围绕 Y 轴逆时针旋转向量（左手法则）
   * @param angle 以弧度表示的角度
   */
  static rotateY(vector, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vector.x * cos + vector.z * sin,
      y: vector.y,
      z: vector.z * cos - vector.x * sin
    };
  }
  /**
   * 围绕 Z 轴逆时针旋转向量（左手法则）
   * @param angle 以弧度表示的角度
   */
  static rotateZ(vector, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vector.x * cos - vector.y * sin,
      y: vector.y * cos + vector.x * sin,
      z: vector.z
    };
  }
};
function toVec3(x, y, z) {
  return { x, y, z };
}

// ../packages/math/src/api/Vector2Utils.ts
var Vector2Utils = class {
  /**
   * 比较两个二维向量是否相等
   *
   * @param vector1 第一个二维向量。
   * @param vector2 第二个二维向量。
   * @returns 如果两个二维向量都相等，返回`true`，否则返回`false`
   */
  static equals(vector1, vector2) {
    return vector1.x === vector2.x && vector1.y === vector2.y;
  }
  /**
   * 将两个二维向量相加
   *
   * @param vector1 第一个二维向量
   * @param vector2 第二个二维向量
   * @returns 相加后的结果向量
   */
  static add(vector1, vector2) {
    return {
      x: vector1.x + (vector2.x ?? 0),
      y: vector1.y + (vector2.y ?? 0)
    };
  }
  /**
   * 将两个二维向量相减
   *
   * @param vector1 作被减数的二维向量
   * @param vector2 作减数的二维向量
   * @returns 相加后的结果相减
   */
  static subtract(vector1, vector2) {
    return {
      x: vector1.x - (vector2.x ?? 0),
      y: vector1.y - (vector2.y ?? 0)
    };
  }
  /**
   * 缩放二维向量
   *
   * @param vector 需要缩放的二维向量
   * @param scale 缩放的倍数
   * @returns 缩放后的二维向量
   */
  static scale(vector, scale) {
    return { x: vector.x * scale, y: vector.y * scale };
  }
  /**
   * 对向量进行向下取整
   *
   * @param vector 需要进行向下取整的二维向量
   * @return
   */
  static floor(vector) {
    return {
      x: Math.floor(vector.x),
      y: Math.floor(vector.y)
    };
  }
  /**
   * 将向量转换为字符串
   *
   * @param vector 需要转换为字符串的二维向量
   * @param decimals 小数位数
   * @param delimiter 分隔符
   * @returns 转换后的字符串
   */
  static toString(vector, decimals = 2, delimiter = ", ") {
    const str = [vector.x.toFixed(decimals), vector.y.toFixed(decimals)];
    return str.join(delimiter ?? ", ");
  }
  /**
   * 从由 {@link Vector2Utils.toString} 生成的字符串表示中获取一个二维向量，如果格式无效，则返回`undefined`
   *
   * @param str 要解析的字符串
   * @param delimiter 分隔符，默认与 {@link Vector3Utils.toString} 的默认值相同
   */
  static fromString(str, delimiter = ",") {
    const parts = str.split(delimiter);
    if (parts.length !== 2) {
      return void 0;
    }
    const output = parts.map((part) => parseFloat(part));
    if (output.some((part) => isNaN(part))) {
      return void 0;
    }
    return { x: output[0], y: output[1] };
  }
};
function toVec2(x, y) {
  return { x, y };
}

// ../packages/math/src/api/Percent.ts
var Percent = class {
  /**
   * 检查数字是否为百分数
   * @param num 要检查的数字
   * @return 如果数字是百分比，则返回`true`，否则返回`false`
   */
  static check(num) {
    return !(num > 1 || num < 0);
  }
  /**
   * 将输入的数字标准化为百分数
   *
   * @param num 需要标准化的数字
   * @returns 标准化后的百分数
   */
  static normalize(num) {
    if (0 <= num && num <= 1) return num;
    return num / 100;
  }
  /**
   * 将数字转换为百分数字符串
   * @param num 需要转换的数字
   * @return 转换后的百分数字符串
   */
  static toString(num) {
    return `${num * 100}%`;
  }
};

// ../packages/math/src/api/Range.ts
var NumberRangeUtils = class {
  constructor() {
  }
  /**
   * 返回某一数字是否在某一范围内
   * @param value 要判断的数字
   * @param min 范围的最小值
   * @param max 范围的最大值
   * @return 如果在范围内返回`true`，否则返回`false`
   */
  static isInRange(value, min, max) {
    return value >= min && value <= max;
  }
};

// ../packages/random/src/api/RandomEvent.ts
var RandomEvent = class {
  /**
   * @param chance 触发该事件的概率，必须为百分数，例如 0.5 表示 50%
   * @param event
   */
  constructor(chance, event) {
    this.chance = chance;
    this.event = event;
    if (!Percent.check(chance)) {
      throw new OccultusSDKError(`Invaild chance!`, "Random Event");
    }
  }
  /**
   * 调用事件，根据给定的概率决定是否触发事件
   *
   * @return 一个布尔值，表示是否触发了事件
   */
  call() {
    const result = Random.decimal(1) <= this.chance;
    if (result) {
      this.event();
    }
    return result;
  }
};

// ../packages/random/src/api/EventList.ts
var EventList = class {
  /**
   * @param data 该事件列表的数据
   */
  constructor(data) {
    this.data = data;
  }
  /**
   * 调用事件，根据给定的权重决定触发何种事件
   *
   * **注意：如果所有事件权重都为 0，会导致无法触发任何事件**
   *
   * @returns 该函数运行的结果
   * @throws 如果找不到要调用的事件，则抛出错误
   */
  call() {
    let weightSum = 0;
    for (const event of this.data) {
      weightSum += event.weight;
    }
    const randValue = Random.integer(weightSum - 1);
    let remaining = randValue;
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      if (remaining < item.weight) {
        item.event?.();
        return {
          weightSum,
          weightRand: randValue,
          dataIndex: i
        };
      }
      remaining -= item.weight;
    }
    throw new OccultusSDKError("Cannot find the event to call!", "Event List");
  }
};

// ../packages/toolkit/src/entity/entityUtils.ts
import {
  EntityComponentTypes as EntityComponentTypes2,
  EquipmentSlot
} from "@minecraft/server";

// ../packages/toolkit/src/identifier/namespace.ts
function ensureNamespace(identifier) {
  if (identifier.includes(":")) {
    return identifier;
  }
  return `minecraft:${identifier}`;
}
function ensureNoNamespace(identifier) {
  if (identifier.includes(":")) {
    return identifier.split(":")[1];
  }
  return identifier;
}

// ../packages/toolkit/src/entity/health.ts
import {
  EntityComponentTypes
} from "@minecraft/server";
var EntityHealthUtils = class {
  component;
  constructor(entity) {
    this.component = entity.getComponent(EntityComponentTypes.Health) ?? (() => {
      throw new OccultusSDKError(
        `Entity ${entity.typeId} (id ${entity.id}) \u6CA1\u6709 EntityHealthComponent!`
      );
    })();
  }
  // 对于 component 方法的重载，便于直接代替原来的 component
  get current() {
    return this.component.currentValue;
  }
  set current(value) {
    this.component.setCurrentValue(value);
  }
  get default() {
    return this.component.defaultValue;
  }
  get max() {
    return this.component.effectiveMax;
  }
  get min() {
    return this.component.effectiveMin;
  }
  reset() {
    this.component.resetToDefaultValue();
  }
  setMax() {
    this.component.resetToMaxValue();
  }
  setMin() {
    this.component.resetToMinValue();
  }
  // 重载结束
  /**
   * 恢复实体的生命值
   * @param amount 恢复的生命值。小于 0 时为未定义行为
   * @return 治愈后的生命值
   */
  heal(value) {
    const newValue = this.current + value;
    return this.current = Math.min(newValue, this.max);
  }
  /**
   * 消耗实体生命值，这一行为不会被视为攻击
   * @param value 伤害大小。小于 0 时为未定义行为
   * @returns
   */
  damage(value) {
    const newValue = this.current - value;
    return this.current = Math.max(newValue, this.min);
  }
  /**
   * 以指定倍率消耗实体的生命值，这一行为不会被视为攻击
   * @param amplifier 消耗生命的倍率，例如`0.8`将会被视为消耗实体当前 80% 的生命值
   * @returns
   */
  damageWithAmplifier(amplifier) {
    return this.damage(this.current * amplifier);
  }
};

// ../packages/toolkit/src/entity/entityUtils.ts
function tryOperateEntity(entity, operate) {
  if (entity.isValid) {
    operate(entity);
    return true;
  }
  return false;
}
function getEquipmentItem(entity, slot = EquipmentSlot.Mainhand) {
  return entity?.getComponent(EntityComponentTypes2.Equippable)?.getEquipment(slot);
}
function setEquipmentItem(entity, item, slot = EquipmentSlot.Mainhand) {
  return entity?.getComponent(EntityComponentTypes2.Equippable)?.setEquipment(slot, item) ?? false;
}
function getContainer(entity) {
  return entity.getComponent(EntityComponentTypes2.Inventory)?.container;
}
function setSlot(entity, slot, item) {
  getContainer(entity)?.setItem(slot, item);
}
function giveItem(entity, item) {
  const container = getContainer(entity);
  if (Array.isArray(item)) {
    for (const i of item) {
      giveItem(entity, i);
    }
    return;
  }
  if (container && container.emptySlotsCount > 0) {
    container.addItem(item);
  } else {
    entity.dimension.spawnItem(item, entity.location);
  }
}
function clearSlot(entity) {
  getContainer(entity)?.clearAll();
}
function applyEffectData(entity, data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  return data.flatMap((effectData) => {
    return entity.addEffect(effectData.effectType, effectData.duration, {
      amplifier: effectData.amplifier,
      showParticles: effectData.showParticles
    });
  });
}
function clearEffect(entity, effectType) {
  const effects = effectGroupMap[effectType] || (Array.isArray(effectType) ? effectType : [effectType]);
  for (const effect of effects) {
    entity.removeEffect(effect);
  }
}
function addEffect(entity, effectType, duration, options) {
  const effects = effectGroupMap[effectType] || (Array.isArray(effectType) ? effectType : [effectType]);
  for (const effect of effects) {
    if (duration === "infinite") {
      entity.runCommand(
        // @ts-ignore
        `effect @s ${ensureNoNamespace(effect)} infinite ${options?.amplifier ?? 0} ${options?.showParticles ?? false}`
      );
      return;
    }
    entity.addEffect(effect, duration, options);
  }
}
function getFamilies(entity) {
  return entity.getComponent("minecraft:type_family")?.getTypeFamilies();
}
function hasFamily(entity, family) {
  return entity.getComponent("minecraft:type_family")?.hasTypeFamily(family) ?? false;
}
function getExpCost(level) {
  if (level >= 30) {
    return 62 + (level - 30) * 7;
  }
  if (level >= 15) {
    return 17 + (level - 15) * 3;
  }
  return 17;
}
function getAllExp(player) {
  const level = player.level;
  let exp = 0;
  for (let i = 1; i <= level; i++) {
    exp += getExpCost(i);
  }
  return exp + player.xpEarnedAtCurrentLevel;
}
function consumeAmount(item, value) {
  const amount = item.amount;
  if (amount === value) {
    return void 0;
  }
  if (amount - value < 0) {
    throw new OccultusSDKError(
      `The number of items is insufficient! Actual amount: ${amount} Consume amount: ${value}`,
      `${item.typeId}`
    );
  }
  if (amount - value > item.maxAmount) {
    throw new OccultusSDKError(
      `The max stack of items is insufficient!`,
      `${item.typeId}`
    );
  }
  const newItem = item.clone();
  newItem.amount = amount - value;
  return newItem;
}
function consumeEquipmentAmount(player, amount = 1) {
  const item = getEquipmentItem(player);
  if (!item) return false;
  return setEquipmentItem(player, consumeAmount(item, amount));
}
function heal(entity, amount) {
  return new EntityHealthUtils(entity).heal(amount);
}
function getCurrentHealth(entity) {
  return new EntityHealthUtils(entity).current;
}
function setCurrentHealth(entity, value) {
  return new EntityHealthUtils(entity).current = value;
}
function consumeHealth(entity, amount) {
  return new EntityHealthUtils(entity).damage(amount);
}
function consumeHealthAmplifier(entity, amplifier) {
  return new EntityHealthUtils(entity).damageWithAmplifier(amplifier);
}

// ../packages/toolkit/src/entity/EntitiesUtils.ts
var EntitiesUtils = class {
  /**
   * @param dimension 实体所在的维度
   * @param queryOption 查询实体的选项
   */
  constructor(dimension, queryOption) {
    this.dimension = dimension;
    this.queryOption = queryOption;
  }
  /**
   * 查询给定条件下的实体
   * @returns
   */
  query() {
    return this.dimension.getEntities(this.queryOption);
  }
  /**
   * 尝试对实体进行操作
   * @param operate 操作函数，接受一个实体作为参数
   */
  tryOperateEntity(operate) {
    this.query().forEach((entity) => {
      if (entity.isValid) {
        operate(entity);
      }
    });
  }
  /**
   * 对批量实体进行伤害
   * @param amount 施加的伤害量
   * @param options 关于伤害来源的额外选项，可能会增加额外的效果或造成受伤实体的额外行为
   * @since Starock 0.6.0 (0.1.0)
   */
  applyDamage(amount, options) {
    this.query().forEach((entity) => entity.applyDamage(amount, options));
  }
  /**
   * 为批量实体添加效果
   *
   * @param effectType 效果的类型
   * @param duration
   * 效果持续时间，以刻为单位 *（20刻=1秒）*
   *
   * 其值必须在范围`[0, 20000000]`内
   * @param effectOption 可选参数，状态效果的具体配置选项
   * @since Starock 0.6.0 (0.1.0)
   */
  addEffect(effectType, duration, effectOption) {
    this.query().forEach(
      (entity) => addEffect(entity, effectType, duration, effectOption)
    );
  }
  /**
   * 批量给予实体物品
   * @param entity 要给予物品的实体
   * @param item 要给予的物品
   * @since Starock 0.6.0 (0.1.0)
   */
  giveItem(item) {
    this.query().forEach((entity) => giveItem(entity, item));
  }
  /**
   * 批量清空实体的容器
   * @since Starock 0.6.0 (0.1.0)
   */
  clearSlot() {
    this.query().forEach((entity) => clearSlot(entity));
  }
  /**
   * 批量为实体应用 {@link EffectData }
   * @param data 要应用的 {@link EffectData }
   * @returns
   */
  applyEffectData(data) {
    return this.query().forEach((entity) => applyEffectData(entity, data));
  }
  /**
   * 恢复实体的生命值
   * @param amount 恢复的生命值，若治愈后生命值超过最大生命值，则重置为最大生命值
   * @return 治愈后的生命值
   * @throws 如果实体没有`minecraft:health`组件，则抛出`OccultusSDKError`
   */
  heal(amount) {
    this.query().forEach((entity) => heal(entity, amount));
  }
};

// ../packages/toolkit/src/item/item.ts
import {
  ItemComponentTypes,
  ItemDurabilityComponent,
  Player as Player3,
  GameMode
} from "@minecraft/server";
function consumeDurability(item, value, entity) {
  const isPlayer = entity instanceof Player3;
  if (isPlayer && entity.getGameMode() === GameMode.Creative) {
    return item;
  }
  const durability = item.getComponent(
    ItemComponentTypes.Durability
  );
  if (durability === void 0 || !(durability instanceof ItemDurabilityComponent)) {
    return item;
  }
  if (durability.damage + value >= durability.maxDurability) {
    if (isPlayer) {
      entity.playSound("random.break");
    }
    return void 0;
  }
  durability.damage += value;
  return item;
}
function consumeAmount2(item, value) {
  const amount = item.amount;
  if (amount === value) {
    return void 0;
  }
  if (amount - value < 0) {
    throw new OccultusSDKError(
      `The number of items is insufficient! Actual amount: ${amount} Consume amount: ${value}`,
      `${item.typeId}`
    );
  }
  if (amount - value > item.maxAmount) {
    throw new OccultusSDKError(
      `The max stack of items is insufficient!`,
      `${item.typeId}`
    );
  }
  const newItem = item.clone();
  newItem.amount = amount - value;
  return newItem;
}
function pushLore(loreText, item) {
  const lore = item.getLore();
  lore.push(loreText);
  item.setLore(lore);
  return item;
}
function migrateEnchantments(from, to) {
  const [fromCom, toCom] = [
    from.getComponent("minecraft:enchantable"),
    to.getComponent("minecraft:enchantable")
  ];
  if (fromCom === void 0 || toCom === void 0) {
    return;
  }
  const enchantments = fromCom.getEnchantments().filter((enchantment) => {
    return toCom.canAddEnchantment(enchantment);
  });
  toCom.addEnchantments(enchantments);
}
function migrateDamage(from, to) {
  const [fromCom, toCom] = [
    from.getComponent("minecraft:durability"),
    to.getComponent("minecraft:durability")
  ];
  if (fromCom === void 0 || toCom === void 0) {
    return;
  }
  toCom.damage = fromCom.damage;
}

// ../packages/toolkit/src/item/container.ts
import { EquipmentSlot as EquipmentSlot2 } from "@minecraft/server";
function getTagItemAmountInContainer(container, tag) {
  let amount = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.hasTag(tag)) {
      amount += itemStack.amount;
    }
  }
  return amount;
}
function removeTagItemInContainer(container, tag, amount) {
  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.hasTag(tag)) {
      if (itemStack.amount > amount) {
        itemStack.amount -= amount;
        container.setItem(slot, itemStack);
        return;
      }
      container.setItem(slot);
      amount -= itemStack.amount;
    }
  }
}
function getItemAmountInContainer(container, typeId) {
  let amount = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.typeId === typeId) {
      amount += itemStack.amount;
    }
  }
  return amount;
}
function getItemAmountOfPlayer(player, typeId) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return 0;
  let amount = getItemAmountInContainer(container, typeId);
  const slots = [
    EquipmentSlot2.Head,
    EquipmentSlot2.Chest,
    EquipmentSlot2.Legs,
    EquipmentSlot2.Feet,
    EquipmentSlot2.Offhand
  ];
  for (const slot of slots) {
    const itemStack = getEquipmentItem(player, slot);
    if (itemStack?.typeId === typeId) {
      amount += itemStack.amount;
    }
  }
  return amount;
}
function removeItemInContainer(container, typeId, amount) {
  for (let slot = 0; slot < container.size; slot++) {
    if (amount <= 0) return 0;
    const itemStack = container.getItem(slot);
    if (itemStack?.typeId === typeId) {
      if (itemStack.amount > amount) {
        itemStack.amount -= amount;
        container.setItem(slot, itemStack);
        return 0;
      }
      container.setItem(slot);
      amount -= itemStack.amount;
    }
  }
  return amount;
}
function removeItemOfPlayer(player, typeId, amount) {
  let remaining = removeItemInContainer(getContainer(player), typeId, amount);
  if (remaining <= 0) return 0;
  const slots = [
    EquipmentSlot2.Head,
    EquipmentSlot2.Chest,
    EquipmentSlot2.Legs,
    EquipmentSlot2.Feet,
    EquipmentSlot2.Offhand
  ];
  for (const slot of slots) {
    if (remaining <= 0) return 0;
    const itemStack = getEquipmentItem(player, slot);
    if (itemStack?.typeId === typeId) {
      if (itemStack.amount > remaining) {
        itemStack.amount -= remaining;
        setEquipmentItem(player, itemStack, slot);
        return 0;
      }
      setEquipmentItem(player, itemStack, slot);
      remaining -= itemStack.amount;
    }
  }
  return remaining;
}
function replaceItemStack(item, newItem, container) {
  let amount = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.typeId === item?.typeId) {
      container.setItem(slot, newItem);
      amount++;
    }
  }
  return amount;
}
function replaceItemByTag(itemTag, newItem, container) {
  let amount = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.hasTag(itemTag)) {
      container.setItem(slot, newItem);
      amount++;
    }
  }
  return amount;
}

// ../packages/toolkit/src/item/cooldown.ts
function isInCooldown(item, player) {
  const cooldown = item.getComponent("minecraft:cooldown");
  if (!cooldown) return false;
  return cooldown.getCooldownTicksRemaining(player) !== 0;
}
function startCooldown(item, player) {
  const cooldown = item.getComponent("minecraft:cooldown");
  if (!cooldown) return false;
  cooldown.startCooldown(player);
  return true;
}

// ../packages/toolkit/src/color.ts
function rgbToHex(rgb) {
  return "#" + ((1 << 24) + (rgb.red << 16) + (rgb.green << 8) + rgb.blue).toString(16).slice(1);
}
function hexToRgb(hex) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  return { red: r, green: g, blue: b };
}

// ../packages/item/src/utils/WeaponInternalUtils.ts
var WeaponInternalUtils = class _WeaponInternalUtils {
  /**
   * 为武器材料注册自定义物品组件
   * @param weapon 要注册为自定义物品组件的武器材料
   */
  static registryItemComponent(weapon, init) {
    init.itemComponentRegistry.registerCustomComponent(weapon.name, {});
  }
  /**
   * 获取武器材料的自定义组件事件
   * @param weapon 要获取事件的武器材料
   * @return 自定义组件事件
   */
  static getCustomComponent(weapon) {
    if (weapon.enableUseEvents) {
      return {
        onHitEntity(arg0) {
          weapon.onHitEntity(arg0);
        },
        onMineBlock(arg0, arg1) {
          weapon.onMineBlock(arg0);
          if (!arg0.itemStack) return;
          const params = arg1.params;
          if (params.virtual) return;
          setEquipmentItem(
            arg0.source,
            consumeDurability(arg0.itemStack, 2, arg0.source)
          );
        },
        onUse(arg0, _arg1) {
          if (!arg0.itemStack) return;
          if (ModManager.getRegistry("skill")) {
            const event = _WeaponInternalUtils.getWeaponSkillList(
              arg0.source,
              arg0.itemStack,
              ModManager.getRegistry("skill"),
              weapon
            );
            event.call();
          }
          weapon.onUse(arg0);
        }
      };
    }
    return {
      onHitEntity(arg0) {
        weapon.onHitEntity(arg0);
      },
      onMineBlock(arg0, arg1) {
        weapon.onMineBlock(arg0);
        if (!arg0.itemStack) return;
        const params = arg1.params;
        if (params.virtual) return;
        setEquipmentItem(
          arg0.source,
          consumeDurability(arg0.itemStack, 2, arg0.source)
        );
      }
    };
  }
  static getWeaponSkillList(atker, item, registry, weapon) {
    const data = [];
    weapon.getAllSkills(item, registry).forEach((skill) => {
      const targets = skill.getTargets(atker);
      data.push({
        weight: skill.weight,
        event: () => {
          {
            skill.event(atker, targets);
          }
        }
      });
    });
    return new EventList(data);
  }
};

// ../packages/item/src/utils/ToolInternalUtils.ts
import {
  world as world5
} from "@minecraft/server";

// ../packages/item/src/events/ToolEvents.ts
import { GameMode as GameMode2 } from "@minecraft/server";
var ToolEvents = class {
  /**
   * 斧头给原木剥皮的事件
   */
  static axeEvent(arg) {
    const [item, player] = [arg.itemStack, arg.player];
    if (!item) return;
    player.playSound("use.wood");
    if (player.getGameMode() === GameMode2.Creative) {
      return;
    }
    setEquipmentItem(player, consumeDurability(item, 1, player));
  }
  /**
   * 锄头耕地的事件
   */
  static hoeEvent(arg) {
    const [item, player] = [arg.itemStack, arg.player];
    if (!item) return;
    player.playSound("step.gravel");
    if (player.getGameMode() === GameMode2.Creative) {
      return;
    }
    setEquipmentItem(player, consumeDurability(item, 1, player));
  }
  /**
   * 锹将泥土转换为土径的事件
   */
  static shovelEvent(arg) {
    const [item, player] = [arg.itemStack, arg.player];
    if (!item) return;
    player.playSound("use.grass");
    if (player.getGameMode() === GameMode2.Creative) {
      return;
    }
    setEquipmentItem(player, consumeDurability(item, 1, player));
  }
};

// ../packages/item/src/utils/ToolInternalUtils.ts
var ToolInternalUtils = class _ToolInternalUtils {
  /**
   * 注册 ToolMaterial 的自定义物品组件
   * @param tool 要注册组件的 ToolMaterial
   */
  static registryItemComponent(tool, init) {
    init.itemComponentRegistry.registerCustomComponent(
      tool.name,
      _ToolInternalUtils.getCustomComponent(tool)
    );
    world5.afterEvents.playerInteractWithBlock.subscribe((arg) => {
      if (!arg.itemStack) return;
      const component = arg.itemStack.getComponent(tool.name);
      if (!component) return;
      const params = component?.customComponentParameters?.params;
      if (!params.type) return;
      switch (params.type) {
        case "axe":
          ToolEvents.axeEvent(arg);
          break;
        case "shovel":
          ToolEvents.shovelEvent(arg);
          break;
        case "hoe":
          ToolEvents.hoeEvent(arg);
          break;
      }
    });
  }
  static getCustomComponent(tool) {
    if (tool.enableUseEvents) {
      return {
        onHitEntity(arg0) {
          tool.onHitEntity(arg0);
        },
        onMineBlock(arg0, arg1) {
          tool.onMineBlock(arg0);
          if (!arg0.itemStack) return;
          const params = arg1.params;
          if (params.virtual) return;
          setEquipmentItem(
            arg0.source,
            consumeDurability(arg0.itemStack, 1, arg0.source)
          );
        },
        onUse(arg0, _arg1) {
          if (!arg0.itemStack) return;
          if (ModManager.getRegistry("skill")) {
            const event = _ToolInternalUtils.getWeaponSkillList(
              arg0.source,
              arg0.itemStack,
              ModManager.getRegistry("skill"),
              tool
            );
            event.call();
          }
          tool.onUse(arg0);
        },
        onUseOn(arg0) {
          tool.onUseOn(arg0);
        }
      };
    }
    return {
      onHitEntity(arg0) {
        tool.onHitEntity(arg0);
      },
      onMineBlock(arg0, arg1) {
        tool.onMineBlock(arg0);
        if (!arg0.itemStack) return;
        const params = arg1.params;
        if (params.virtual) return;
        setEquipmentItem(
          arg0.source,
          consumeDurability(arg0.itemStack, 1, arg0.source)
        );
      }
    };
  }
  static getWeaponSkillList(atker, item, registry, weapon) {
    const data = [];
    weapon.getAllSkills(item, registry).forEach((skill) => {
      const targets = skill.getTargets(atker);
      data.push({
        weight: skill.weight,
        event: () => {
          {
            skill.event(atker, targets);
          }
        }
      });
    });
    return new EventList(data);
  }
};

// ../packages/item/src/utils/FoodInternalUtils.ts
var FoodInternalUtils = class _FoodInternalUtils {
  static registryItemComponent(food, init) {
    init.itemComponentRegistry.registerCustomComponent(food.name, {
      onConsume(callback, param) {
        if (food.onConsume) food.onConsume(callback);
        const p = param.params;
        const data = _FoodInternalUtils.parse(p);
        if (!data) return;
        if (_FoodInternalUtils.parse(p)) applyEffectData(callback.source, data);
        _FoodInternalUtils.clearEffects(callback.source, p);
      }
    });
  }
  /**
   * 解析组件参数
   * @param data
   * @returns
   */
  static parse(data) {
    if (!data.effect) return;
    const effects = [];
    function pushEffectData(type, duration, amplifier, particle, index = 0) {
      effects.push({
        effectType: type,
        duration: Array.isArray(duration) ? duration[index] : duration,
        amplifier: Array.isArray(amplifier) ? amplifier[index] : amplifier,
        showParticles: Array.isArray(particle) ? particle[index] : particle
      });
    }
    if (typeof data.effect === "string") {
      if (foodEffectGroupMap[data.effect]) {
        const groupEffects = effectGroupMap[data.effect];
        groupEffects.forEach((effect) => {
          pushEffectData(
            effect,
            data.duration,
            data.amplifier,
            data.show_particles
          );
        });
        return effects;
      }
      pushEffectData(
        data.effect,
        data.duration,
        data.amplifier,
        data.show_particles
      );
      return effects;
    }
    if (Array.isArray(data.effect)) {
      data.effect.forEach((effect, index) => {
        pushEffectData(
          effect,
          data.duration,
          data.amplifier,
          data.show_particles,
          index
        );
      });
      return effects;
    }
  }
  static clearEffects(entity, data) {
    const clear = data.clear;
    if (!clear) return;
    if (effectGroupMap[clear]) {
      const groupEffects = effectGroupMap[clear];
      groupEffects.forEach((effect) => {
        entity.removeEffect(effect);
      });
      return;
    }
    if (Array.isArray(clear)) {
      clear.forEach((effect) => {
        entity.removeEffect(effect);
      });
      return;
    }
    entity.removeEffect(clear);
  }
};
var foodEffectGroupMap = {
  ALL: [...positiveEffectsId, ...negativeEffectsId, ...neutralEffectsId],
  BAD: negativeEffectsId,
  GOOD: positiveEffectsId,
  NEUTRAL: neutralEffectsId
};

// ../packages/item/src/api/base/ItemRegistries.ts
import { system as system6 } from "@minecraft/server";
var ItemRegistries = class extends Registries {
  materials = /* @__PURE__ */ new Map();
  id = "ItemRegistries";
  delete(id) {
    return this.materials.delete(id);
  }
  get(id) {
    return this.materials.get(id);
  }
  has(id) {
    return this.materials.has(id);
  }
  getAll() {
    const arr = [];
    this.materials.forEach((item) => {
      arr.push(item);
    });
    return arr;
  }
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        this.materials.set(item.name, item);
      });
      return;
    }
    this.materials.set(value.name, value);
  }
  register() {
    system6.beforeEvents.startup.subscribe((init) => {
      this.materials.forEach((value) => {
        if (value instanceof WeaponMaterial) {
          WeaponInternalUtils.registryItemComponent(value, init);
          return;
        }
        if (value instanceof ToolMaterial) {
          ToolInternalUtils.registryItemComponent(value, init);
          return;
        }
        if (value instanceof FoodMaterial) {
          FoodInternalUtils.registryItemComponent(value, init);
          return;
        }
      });
    });
  }
};

// ../packages/item/src/enums/ItemTiers.ts
var ItemTiers = /* @__PURE__ */ ((ItemTiers2) => {
  ItemTiers2[ItemTiers2["Wooden"] = 0] = "Wooden";
  ItemTiers2[ItemTiers2["Golden"] = 1] = "Golden";
  ItemTiers2[ItemTiers2["Stone"] = 2] = "Stone";
  ItemTiers2[ItemTiers2["Copper"] = 3] = "Copper";
  ItemTiers2[ItemTiers2["Iron"] = 4] = "Iron";
  ItemTiers2[ItemTiers2["Diamond"] = 5] = "Diamond";
  ItemTiers2[ItemTiers2["Netherite"] = 6] = "Netherite";
  ItemTiers2[ItemTiers2["Custom"] = 7] = "Custom";
  ItemTiers2[ItemTiers2["None"] = -1] = "None";
  return ItemTiers2;
})(ItemTiers || {});

// ../packages/item/src/data/tierMap.ts
var tierMap = {
  wooden: 0 /* Wooden */,
  gold: 1 /* Golden */,
  stone: 2 /* Stone */,
  iron: 4 /* Iron */,
  diamond: 5 /* Diamond */,
  netherite: 6 /* Netherite */,
  custom: 7 /* Custom */,
  none: -1 /* None */
};

// ../packages/item/src/api/ItemTier.ts
var ItemTier = class {
  /**
   * 根据物品的标签获取其等级
   *
   * @param item 要获取等级的物品
   * @returns  返回物品的等级，如果未找到匹配的标签则返回自定义等级或无等级
   */
  static getTier(item) {
    const tags = item.getTags();
    if (tags.includes("minecraft:netherite_tier")) return 6 /* Netherite */;
    if (tags.includes("minecraft:diamond_tier")) return 5 /* Diamond */;
    if (tags.includes("minecraft:iron_tier")) return 4 /* Iron */;
    if (tags.includes("minecraft:stone_tier")) return 2 /* Stone */;
    if (tags.includes("minecraft:golden_tier")) return 1 /* Golden */;
    if (tags.includes("minecraft:wooden_tier")) return 0 /* Wooden */;
    tags.forEach((tag) => {
      if (tag.includes("tier")) return 7 /* Custom */;
    });
    return -1 /* None */;
  }
  /**
   * 检查指定物品是否具有等于或高于给定等级的等级
   * @param tier 要检查的等级
   * @param item 要检查的物品
   * @returns 如果物品的等级等于或高于给定等级，则返回 true；否则返回 false
   */
  static hasTier(tier, item) {
    const ownedTier = this.getTier(item);
    return ownedTier >= tier;
  }
  /**
   * 将字符串转换为物品等级枚举值。
   *
   * @param str 要转换的字符串
   * @returns 转换后的物品等级枚举值
   * @throws 如果输入的字符串不是有效的物品等级，则抛出错误
   */
  static stringfyTier(str) {
    if (tierMap[str])
      return tierMap[str];
    throw new OccultusSDKError("Invalid tier string!", "stringfyTier");
  }
};

// ../packages/task/src/api/Task.ts
import { world as world6 } from "@minecraft/server";

// ../packages/task/src/enum/TaskStatus.ts
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2[TaskStatus2["Locked"] = -1] = "Locked";
  TaskStatus2[TaskStatus2["Undone"] = 0] = "Undone";
  TaskStatus2[TaskStatus2["Done"] = 1] = "Done";
  return TaskStatus2;
})(TaskStatus || {});

// ../packages/task/src/api/Task.ts
import { ActionFormData } from "@minecraft/server-ui";

// ../packages/task/src/utils/TaskUtils.ts
import {
  CustomCommandSource,
  CustomCommandStatus,
  Player as Player5,
  system as system7
} from "@minecraft/server";
var TaskUtils = class {
  static generateTaskBody(task, player) {
    const texts = [];
    texts.push(parseToRaw(task.description, player));
    texts.push({ text: Format.newLine }, { text: Format.newLine });
    if (task.options.tips) {
      texts.push(
        { translate: "ui.task.tips" },
        parseToRaw(task.options.tips, player)
      );
      texts.push({ text: Format.newLine });
    }
    texts.push({ translate: "ui.task.condition" });
    task.options.conditions.forEach((condition) => {
      texts.push(parseToRaw(condition.getTextProvider(), player));
    });
    texts.push({ text: Format.newLine });
    texts.push({ translate: "ui.task.award" });
    task.options.awards.forEach((award) => {
      texts.push(parseToRaw(award.getTextProvider(), player));
    });
    texts.push({ text: Format.newLine });
    return {
      rawtext: texts
    };
  }
  static generateFailMessage(task, player) {
    const texts = [];
    texts.push({ translate: "ui.task.failed_reason" });
    task.options.conditions.forEach((condition) => {
      if (condition.check(player)) return;
      texts.push(parseToRaw(condition.getFailedReason(), player));
    });
    return {
      rawtext: texts
    };
  }
  static getTaskListButtonName(task, player) {
    const raw = [];
    if (task.getStatus(player) === 1 /* Done */) {
      raw.push({ text: Color.darkGreen });
      raw.push({ text: "\u2714" });
      raw.push({ text: Format.reset }, { text: "" });
    }
    raw.push(parseToRaw(task.name, player));
    return { rawtext: raw };
  }
  static generateGroupAwardButton(task, player) {
    const raw = [];
    if (task.hasOwnedAward(player)) {
      raw.push({ text: Color.darkGreen });
      raw.push({ text: "\u2714" });
      raw.push({ text: Format.reset }, { text: "" });
    }
    raw.push({ translate: "ui.task.getAward" });
    return { rawtext: raw };
  }
  static registryComponent(componentName, center) {
    system7.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(componentName, {
        onUse(arg0) {
          center.display(arg0.source, []);
        }
      });
    });
  }
  static registryCommand(command, center) {
    system7.beforeEvents.startup.subscribe((arg) => {
      arg.customCommandRegistry.registerCommand(command, (origin) => {
        system7.run(() => {
          if (origin.sourceType !== CustomCommandSource.Entity)
            return {
              status: CustomCommandStatus.Failure
            };
          if (!(origin.sourceEntity instanceof Player5))
            return {
              status: CustomCommandStatus.Failure
            };
          center.display(origin.sourceEntity, []);
          return {
            status: CustomCommandStatus.Success
          };
        });
        return {
          status: CustomCommandStatus.Failure
        };
      });
    });
  }
};

// ../packages/task/src/ui/LockedScreen.ts
import { MessageFormData } from "@minecraft/server-ui";
var LockedScreen = class {
  static create(task, player) {
    const previous = task.options.previousTask;
    if (previous === "none") {
      throw new Error("Previous task is not set");
    }
    const form = new MessageFormData();
    form.title({ translate: "task.locked" });
    form.body({
      rawtext: [
        { translate: "task.locked.body" },
        { text: Format.newLine },
        parseToRaw(previous.name, player)
      ]
    });
    form.button1({ translate: "gui.back" });
    form.button2({ translate: "ui.task.goto" });
    return form;
  }
};

// ../packages/task/src/api/Task.ts
var Task = class extends FormLike {
  /**
   * @param id 任务的唯一标识符
   * @param name 任务名称
   * @param description 任务描述
   * @param options 任务的配置选项
   */
  constructor(id, name, description, options) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.options = options;
  }
  compeleteEvent = () => {
  };
  /**
   * 向玩家展示任务
   * @param player 要展示任务的玩家
   * @param backTo 关闭任务 UI 后返回的界面
   */
  display(player, backTo) {
    if (this.getStatus(player) === -1 /* Locked */) {
      this.lockedDisplay(player, backTo);
      return;
    }
    const form = new ActionFormData();
    form.title(parseText(this.name, player));
    form.body(TaskUtils.generateTaskBody(this, player));
    form.button({ translate: "gui.back" });
    if (this.getStatus(player) === 1 /* Done */) {
      form.button({ translate: "ui.task.done" });
    } else {
      form.button({ translate: "ui.task.submit" });
    }
    form.show(player).then((result) => {
      if (result.selection === 1) {
        if (this.getStatus(player) === 1 /* Done */)
          return this.quit(player, backTo);
        if (this.checkConditions(player)) {
          this.complete(player);
          return this.quit(player, backTo);
        }
        player.sendMessage(TaskUtils.generateFailMessage(this, player));
        return this.quit(player, backTo);
      }
      this.quit(player, backTo);
    });
  }
  /**
   * 返回玩家是否可以在任务列表中看到该任务
   * @param player
   * @return 倘若玩家可以在任务列表中看到该任务返回`true`，否则返回`false`
   */
  isVisible(player) {
    if (this.isAvailable(player)) return true;
    if (this.options.hiddenWhenLocked) return false;
    return true;
  }
  isAvailable(player) {
    if (this.getStatus(player) === 1 /* Done */) return true;
    if (this.options.previousTask === "none") return true;
    if (this.options.previousTask.getStatus(player) === 1 /* Done */)
      return true;
    return false;
  }
  lockedDisplay(player, backTo) {
    const screen = LockedScreen.create(this, player);
    screen.show(player).then((response) => {
      if (this.options.previousTask === "none")
        return this.quit(player, backTo);
      if (response.selection === 1) {
        const previous = this.options.previousTask;
        this.jumpTo(player, previous, backTo);
      }
      this.quit(player, backTo);
    });
  }
  /**
   * 获取任务状态
   * @param player 要获取任务状态的玩家
   * @return 玩家的任务状态
   */
  getStatus(player) {
    if (player.hasTag("done:" + this.id)) return 1 /* Done */;
    if (this.options.previousTask === "none") return 0 /* Undone */;
    if (this.options.previousTask.getStatus(player) === 1 /* Done */) {
      return 0 /* Undone */;
    }
    return -1 /* Locked */;
  }
  /**
   * 检查玩家是否能完成任务
   * @param player
   * @returns
   */
  checkConditions(player) {
    const conditions = this.options.conditions;
    if (conditions.length === 0) return true;
    return conditions.every((condition) => condition.check(player));
  }
  /**
   * 向玩家给予奖励
   * @param player
   */
  giveAwards(player) {
    this.options.awards.forEach((award) => award.give(player));
  }
  complete(player) {
    player.addTag("done:" + this.id);
    this.giveAwards(player);
    player.onScreenDisplay.setActionBar({
      rawtext: [
        // 你完成了任务：
        { translate: "ui.task.complete" },
        parseToRaw(this.name, player)
      ]
    });
    world6.sendMessage({
      rawtext: [
        { translate: "ui.task.complete.world", with: [player.name] },
        parseToRaw(this.name, player)
      ]
    });
    this.compeleteEvent(player, this);
    player.playSound(this.options.completeSound ?? "random.levelup");
  }
  /**
   * 直接将任务上传到服务端监听器中
   *
   * **IMPORTANT: 除非任务使用的条件有特殊说明，否则此方法一般无用**
   * @param server
   */
  pushToServer(server) {
    server.addTask(this);
  }
  onComplete(event) {
    this.compeleteEvent = event;
  }
};

// ../packages/task/src/ui/TaskListScreen.ts
import { ActionFormData as ActionFormData2 } from "@minecraft/server-ui";
var TaskListScreen = class {
  constructor(screen, tasks) {
    this.screen = screen;
    this.tasks = tasks;
  }
  static create(origin, player) {
    const form = new ActionFormData2();
    form.title(parseToRaw(origin.name, player));
    form.body(parseToRaw(origin.description, player));
    if (origin instanceof TaskGroup) {
      form.button({ translate: "ui.getAward" });
    }
    const tasks = [];
    origin.options.tasks.forEach((task) => {
      if (!task.isVisible(player)) return;
      form.button(
        TaskUtils.getTaskListButtonName(task, player),
        task.options.iconPath
      );
      tasks.push(task);
    });
    return { screen: form, tasks };
  }
};

// ../packages/task/src/api/TaskGroup.ts
var TaskGroup = class extends FormLike {
  constructor(id, name, description, options) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.options = options;
  }
  display(player, backTo) {
    if (this.getStatus(player) === -1 /* Locked */) {
      this.lockedDisplay(player, backTo);
      return;
    }
    const { screen, tasks } = TaskListScreen.create(this, player);
    screen.show(player).then((response) => {
      if (response.canceled) {
        return this.quit(player, backTo);
      }
      if (response.selection === void 0) {
        return this.quit(player, backTo);
      }
      if (response.selection === 0) {
        if (this.hasOwnedAward(player)) {
          player.onScreenDisplay.setActionBar({
            translate: "ui.taskGroup.award.owned"
          });
          return this.quit(player, backTo);
        }
        if (this.getStatus(player) === 1 /* Done */) {
          this.giveAward(player);
        }
        return this.quit(player, backTo);
      }
      const selected = tasks[response.selection - 1];
      this.jumpTo(player, selected, backTo);
    }).catch((err) => {
      console.log(err);
      this.quit(player, backTo);
    });
  }
  isVisible(player) {
    if (this.isAvailable(player)) return true;
    if (this.options.hiddenWhenLocked) return false;
    return true;
  }
  isAvailable(player) {
    if (this.getStatus(player) === 1 /* Done */) return true;
    if (this.options.previousTask === "none") return true;
    if (this.options.previousTask.getStatus(player) === 1 /* Done */)
      return true;
    return false;
  }
  getStatus(player) {
    if (this.options.tasks.every(
      (task) => task.getStatus(player) === 1 /* Done */
    )) {
      return 1 /* Done */;
    }
    if (this.options.previousTask === "none") return 0 /* Undone */;
    if (this.options.previousTask.getStatus(player) === 1 /* Done */)
      return 0 /* Undone */;
    return -1 /* Locked */;
  }
  hasOwnedAward(player) {
    return player.hasTag(`taskGroup.${this.id}.award`);
  }
  ownAward(player) {
    player.addTag(`taskGroup.${this.id}.award`);
  }
  lockedDisplay(player, backTo) {
    const screen = LockedScreen.create(this, player);
    screen.show(player).then((response) => {
      if (this.options.previousTask === "none")
        return this.quit(player, backTo);
      if (response.selection === 1) {
        const previous = this.options.previousTask;
        this.jumpTo(player, previous, backTo);
      }
      this.quit(player, backTo);
    });
  }
  giveAward(player) {
    this.options.awards.forEach((award) => award.give(player));
    this.ownAward(player);
  }
};

// ../packages/task/src/api/TaskCenter.ts
var TaskCenter = class extends FormLike {
  constructor(id, name, description, options) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.options = options;
  }
  /**
   * 向玩家展示任务中心
   * @param player 要展示的玩家
   */
  display(player, backTo) {
    const { screen, tasks } = TaskListScreen.create(this, player);
    screen.show(player).then((response) => {
      if (response.canceled) return this.quit(player, backTo);
      if (response.selection === void 0) return this.quit(player, backTo);
      return this.jumpTo(player, tasks[response.selection], backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
  addTrigger(itemComponent, command) {
    if (itemComponent) TaskUtils.registryComponent(itemComponent, this);
    if (command) TaskUtils.registryCommand(command, this);
  }
};

// ../packages/task/src/api/awards/TaskAwards.ts
var TaskAwards = class {
  /**
   * @param data 奖励数据
   */
  constructor(data) {
    this.data = data;
  }
};

// ../packages/task/src/api/awards/ExpAwards.ts
var ExpAwards = class extends TaskAwards {
  constructor(amount) {
    super(amount);
    this.amount = amount;
  }
  give(player) {
    player.addExperience(this.amount);
  }
  getTextProvider() {
    return {
      rawtext: [
        { translate: "task.awards.exp" },
        { text: " \xD7 " },
        { text: this.amount.toString() }
      ]
    };
  }
};

// ../packages/task/src/api/awards/LevelAwards.ts
var LevelAwards = class extends TaskAwards {
  constructor(amount) {
    super(amount);
    this.amount = amount;
  }
  give(player) {
    player.addLevels(this.amount);
  }
  getTextProvider() {
    return {
      rawtext: [
        { translate: "task.awards.level" },
        { text: " \xD7 " },
        { text: this.amount.toString() }
      ]
    };
  }
};

// ../packages/task/src/api/awards/ItemAwards.ts
import { ItemStack as ItemStack6 } from "@minecraft/server";
var ItemAwards = class extends TaskAwards {
  constructor(itemType, amount) {
    super(itemType);
    this.itemType = itemType;
    this.amount = amount;
  }
  getItem() {
    return new ItemStack6(this.itemType, this.amount);
  }
  give(player) {
    giveItem(player, this.getItem());
  }
  getTextProvider() {
    const item = this.getItem();
    return {
      rawtext: [
        { translate: toOneLine(item.localizationKey) },
        { text: " \xD7 " },
        { text: item.amount.toString() }
      ]
    };
  }
};

// ../packages/task/src/api/TaskServer.ts
import { EntityDamageCause, Player as Player9, world as world7 } from "@minecraft/server";

// ../packages/condition/src/api/ItemConditions.ts
import { ItemStack as ItemStack7 } from "@minecraft/server";

// ../packages/condition/src/api/Conditions.ts
var Conditions = class {
  constructor() {
  }
};

// ../packages/condition/src/api/ItemConditions.ts
var ItemConditions = class extends Conditions {
  /**
   * @param itemType 满足条件所需要的物品类型
   * @param amount 满足条件所需要的物品数量，默认为 1
   * @param consumeAmount 倘若为`true`，则条件检查通过后会自动消耗对应物品
   */
  constructor(itemType, amount = 1, consumeAmount3 = false) {
    super();
    this.itemType = itemType;
    this.amount = amount;
    this.consumeAmount = consumeAmount3;
  }
  /**
   * 获取条件对应的 ItemStack
   * @returns
   */
  getItem() {
    return new ItemStack7(this.itemType, this.amount);
  }
  /**
   * 检查玩家是否符合该条件的要求
   *
   * **IMPORTANT: 若`consumeAmount`属性被设置为`true`，则当检查通过时将对玩家的背包进行修改**
   * @param player
   * @return
   */
  check(player, visual = false) {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    const amount = getItemAmountOfPlayer(player, this.getItem().typeId);
    if (amount >= this.getItem().amount) {
      if (visual) return true;
      if (!this.consumeAmount) return true;
      removeItemOfPlayer(player, this.itemType, this.amount);
      return true;
    }
    return false;
  }
  /**
   * 获得条件对应的 {@link TextProvider}
   * @returns
   */
  getTextProvider() {
    return {
      rawtext: [
        { translate: toOneLine(this.getItem().localizationKey) },
        { text: " \xD7 " },
        { text: this.getItem().amount.toString() }
      ]
    };
  }
  /**
   * 获得条件对应的失败原因
   * @returns
   */
  getFailedReason() {
    return {
      rawtext: [
        // 你缺少这些物品：
        { translate: "task.condition.item.failed" },
        { text: " " },
        { translate: this.getItem().localizationKey },
        { text: " \xD7 " },
        { text: this.getItem().amount.toString() }
      ]
    };
  }
};

// ../packages/condition/src/api/KillEntityConditions.ts
var KillEntityConditions = class extends Conditions {
  /**
   * @param entityType 满足条件所需要的实体类型
   */
  constructor(entityType) {
    super();
    this.entityType = entityType;
  }
  check(_player, _visual = false) {
    return false;
  }
  getTextProvider() {
    return {
      rawtext: [
        // 击杀实体：
        { translate: "task.condition.killentity" },
        { translate: Localization.getEntityKey(this.entityType) }
      ]
    };
  }
  getFailedReason() {
    return {
      rawtext: [
        // 你需要击杀实体：
        { translate: "task.condition.killentity.failed" },
        { text: " " },
        { translate: Localization.getEntityKey(this.entityType) }
      ]
    };
  }
};

// ../packages/condition/src/api/KillEntityFamilyCondition.ts
var KillEntityFamilyConditions = class extends Conditions {
  /**
   * @param family 满足条件所需要的实体类型
   */
  constructor(family, localizationKey) {
    super();
    this.family = family;
    this.localizationKey = localizationKey;
  }
  check(_player, _visual = false) {
    return false;
  }
  getTextProvider() {
    return {
      rawtext: [
        // 击杀此类实体：
        { translate: "task.condition.killEntityFamily" },
        { translate: this.localizationKey }
      ]
    };
  }
  getFailedReason() {
    return {
      rawtext: [
        // 你需要击杀此类实体：
        { translate: "task.condition.killEntityFamily.failed" },
        { text: " " },
        { translate: this.localizationKey }
      ]
    };
  }
};

// ../packages/condition/src/api/LevelConditions.ts
var LevelConditions = class extends Conditions {
  /**
   * @param level 满足条件所需的最低等级
   * @param consumeAmount 倘若为`true`，则条件检查通过后会自动消耗对应等级
   */
  constructor(level, consumeAmount3 = false) {
    super();
    this.level = level;
    this.consumeAmount = consumeAmount3;
  }
  check(player, visual = false) {
    if (player.level >= this.level) {
      if (visual) return true;
      if (!this.consumeAmount) return true;
      player.addLevels(-this.level);
      return true;
    }
    return false;
  }
  getTextProvider() {
    return {
      rawtext: [
        // 达到 %s 级
        {
          translate: "task.condition.level",
          with: { text: this.level.toString() }
        }
      ]
    };
  }
  getFailedReason() {
    return {
      rawtext: [
        // 你需要达到 %s 级
        {
          translate: "task.condition.level.failed",
          with: { text: this.level.toString() }
        }
      ]
    };
  }
};

// ../packages/condition/src/api/ExpCondition.ts
var ExpConditions = class extends Conditions {
  /**
   * @param experience 满足条件所需的最低等级
   * @param consumeAmount 倘若为`true`，则条件检查通过后会自动消耗对应等级
   */
  constructor(experience, consumeAmount3 = false) {
    super();
    this.experience = experience;
    this.consumeAmount = consumeAmount3;
  }
  check(player, visual = false) {
    if (getAllExp(player) >= this.experience) {
      if (visual) return true;
      if (!this.consumeAmount) return true;
      player.addExperience(-this.experience);
      return true;
    }
    return false;
  }
  getTextProvider() {
    return {
      rawtext: [
        // 达到 %s 级
        {
          translate: "task.condition.level",
          with: { text: this.experience.toString() }
        }
      ]
    };
  }
  getFailedReason() {
    return {
      rawtext: [
        // 你需要达到 %s 级
        {
          translate: "task.condition.level.failed",
          with: { text: this.experience.toString() }
        }
      ]
    };
  }
};

// ../packages/condition/src/api/ItemTagConditions.ts
var ItemTagConditions = class extends Conditions {
  /**
   * @param tag 满足条件所需要的物品标签
   * @param amount 满足条件所需要的物品数量，默认为 1
   * @param translateKey 条件对应的翻译键
   * @param consumeAmount 检查通过时是否消耗物品，默认为 false
   */
  constructor(tag, amount = 1, translateKey, consumeAmount3 = false) {
    super();
    this.tag = tag;
    this.amount = amount;
    this.translateKey = translateKey;
    this.consumeAmount = consumeAmount3;
  }
  /**
   * 检查玩家是否符合该条件的要求
   *
   * **IMPORTANT: 若`consumeAmount`属性被设置为`true`，则当检查通过时将对玩家的背包进行修改**
   * @param player
   * @return
   */
  check(player, visual = false) {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    const amount = getTagItemAmountInContainer(container, this.tag);
    if (amount >= this.amount) {
      if (visual) return true;
      if (!this.consumeAmount) return true;
      removeTagItemInContainer(container, this.tag, this.amount);
      return true;
    }
    return false;
  }
  /**
   * 获得条件对应的 {@link TextProvider}
   * @returns
   */
  getTextProvider() {
    return {
      rawtext: [
        { translate: "task.condition.itemTag" },
        { text: " \xD7 " },
        { text: this.translateKey }
      ]
    };
  }
  /**
   * 获得条件对应的失败原因
   * @returns
   */
  getFailedReason() {
    return {
      rawtext: [
        // 你缺少这些物品：
        { translate: "task.condition.itemTag.failed" },
        { text: " " },
        { translate: this.translateKey },
        { text: " \xD7 " },
        { text: this.amount.toString() }
      ]
    };
  }
};

// ../packages/task/src/api/TaskServer.ts
var TaskServer = class {
  startUp() {
    world7.afterEvents.entityDie.subscribe((event) => {
      const { deadEntity, damageSource } = event;
      const task = this.entities.get(deadEntity.typeId);
      if (!task) return;
      if (damageSource.cause !== EntityDamageCause.entityAttack) return;
      if (!damageSource.damagingEntity) return;
      if (!(damageSource.damagingEntity instanceof Player9)) return;
      if (task.getStatus(damageSource.damagingEntity) === 1 /* Done */)
        return;
      task.complete(damageSource.damagingEntity);
    });
    world7.afterEvents.entityDie.subscribe((event) => {
      const { deadEntity, damageSource } = event;
      const damagingEntity = damageSource.damagingEntity;
      if (damageSource.cause !== EntityDamageCause.entityAttack) return;
      if (!damagingEntity) return;
      if (!(damagingEntity instanceof Player9)) return;
      getFamilies(deadEntity)?.forEach((family) => {
        const task = this.families.get(family);
        if (!task) return;
        if (task.getStatus(damagingEntity) === 1 /* Done */) return;
        task.complete(damagingEntity);
      });
    });
    world7.afterEvents.playerInventoryItemChange.subscribe((arg) => {
      const { player, itemStack } = arg;
      if (!itemStack) return;
      if (!this.items.has(itemStack.typeId)) return;
      const task = this.items.get(itemStack.typeId);
      if (task?.getStatus(player) === 1 /* Done */) return;
      task?.complete(player);
    });
    world7.afterEvents.playerInventoryItemChange.subscribe((arg) => {
      const { player, itemStack } = arg;
      if (!itemStack) return;
      const itemTags = itemStack.getTags();
      if (!itemTags || itemTags.length === 0) return;
      itemTags.forEach((tag) => {
        if (!this.itemTags.has(tag)) return;
        const tagTask = this.itemTags.get(tag);
        if (tagTask?.getStatus(player) === 1 /* Done */) return;
        tagTask?.complete(player);
      });
    });
    console.log("[Occultus SDK] Task Server Started");
  }
  entities = /* @__PURE__ */ new Map();
  families = /* @__PURE__ */ new Map();
  items = /* @__PURE__ */ new Map();
  itemTags = /* @__PURE__ */ new Map();
  constructor() {
    this.startUp();
  }
  addCondition(condition, bindTo) {
    if (condition instanceof KillEntityConditions) {
      this.entities.set(condition.entityType, bindTo);
    }
    if (condition instanceof KillEntityFamilyConditions) {
      this.families.set(condition.family, bindTo);
    }
    if (condition instanceof ItemConditions) {
      this.items.set(condition.itemType, bindTo);
    }
    if (condition instanceof ItemTagConditions) {
      this.itemTags.set(condition.tag, bindTo);
    }
  }
  /**
   * 向任务服务器添加任务，以启用智能提交功能
   * 
   * **IMPORTANT: 倘若启用智能提交功能，则当玩家完成`conditons`数组中任意条件时，任务都会自动设置为已完成状态**
   * @param task
   */
  addTask(...task) {
    if (Array.isArray(task)) {
      task.forEach((task2) => {
        task2.options.conditions.forEach(
          (condition) => this.addCondition(condition, task2)
        );
      });
      return;
    }
  }
};

// ../packages/music/src/api/MusicDisc.ts
var MusicDisc = class {
  /**
   * @param typeId 唱片的类型ID，用于区分不同的唱片
   * @param trackName 唱片中的曲目名称
   * @param name 唱片的名称
   * @param artist 唱片的作者
   */
  constructor(typeId, trackName, name, artist) {
    this.typeId = typeId;
    this.trackName = trackName;
    this.name = name;
    this.artist = artist;
  }
};

// ../packages/music/src/api/MusicDiscServer.ts
import { world as world8 } from "@minecraft/server";

// ../packages/music/src/utils.ts
import { system as system8 } from "@minecraft/server";
function breakListener(event, server) {
  const block = event.block;
  const player = event.player;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const recordComponent = block.getComponent("record_player");
  if (!recordComponent) return;
  const record = recordComponent.getRecord();
  if (!record) return;
  const sound = server.records.get(record.typeId);
  if (sound) {
    system8.run(() => {
      player.runCommand(`stopsound @a ${sound}`);
    });
  }
}
function removeListener(event, server) {
  const block = event.block;
  const player = event.player;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const record = block?.getComponent("record_player")?.getRecord()?.typeId;
  if (!record) return;
  const sound = server.records.get(record);
  if (sound) {
    system8.run(() => {
      player.runCommand(`stopsound @a ${sound}`);
    });
  }
}
function inputListener(event, server) {
  const { player, itemStack, block } = event;
  if (!itemStack) return;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const record = server.records.get(itemStack?.typeId);
  const artist = server.artists.get(itemStack?.typeId);
  const name = server.names.get(itemStack?.typeId);
  if (itemStack) {
    if (record && !block?.getComponent("record_player")?.isPlaying()) {
      system8.run(() => {
        block.dimension.playSound(record, block.location);
        block.dimension.getPlayers({
          location: block.location,
          minDistance: 0,
          maxDistance: 10
        }).forEach((player2) => {
          player2.onScreenDisplay.setActionBar([
            Color.lightPurple,
            {
              translate: "record.nowPlaying",
              with: [`${artist} - ${name}`]
            }
          ]);
        });
      });
    } else if (record && block?.getComponent("record_player")?.isPlaying()) {
      system8.run(() => {
        player.runCommand(`stopsound @a ${record}`);
      });
    }
  }
}

// ../packages/music/src/api/MusicDiscServer.ts
var MusicDiscServer = class {
  /**
   * 初始化服务端事件监听器
   * @private
   */
  initServer() {
    world8.beforeEvents.playerInteractWithBlock.subscribe((arg) => {
      inputListener(arg, this);
    });
    world8.beforeEvents.playerInteractWithBlock.subscribe((arg) => {
      removeListener(arg, this);
    });
    world8.beforeEvents.playerBreakBlock.subscribe((arg) => {
      breakListener(arg, this);
    });
  }
  constructor() {
    this.initServer();
  }
  /** 存储唱片类型ID与音轨名称的映射 */
  records = /* @__PURE__ */ new Map();
  /** 存储唱片类型ID与艺术家名称的映射 */
  artists = /* @__PURE__ */ new Map();
  /** 存储唱片类型ID与唱片显示名称的映射 */
  names = /* @__PURE__ */ new Map();
  /**
   * 添加一张音乐唱片到服务器
   * @param record 要添加的音乐唱片对象
   */
  addDisc(record) {
    this.records.set(record.typeId, record.trackName);
    this.artists.set(record.typeId, record.artist);
    this.names.set(record.typeId, record.name);
  }
};

// ../packages/music/src/api/Bindings/MusicDiscServerBindings.ts
import {
  system as system9,
  world as world9
} from "@minecraft/server";
var MusicDiscServerBindings = class _MusicDiscServerBindings {
  constructor(config) {
    this.config = config;
    this.registryComponent(config);
    this.subscribeEvents(config);
  }
  static instance;
  /**
   * 获取音乐唱片组件的音轨名称
   * @param itemStack 
   * @returns 
   */
  static getTrackName(itemStack) {
    const config = _MusicDiscServerBindings.getInstance().config;
    const params = itemStack.getComponent(config.componentName)?.customComponentParameters.params;
    return params.track_name;
  }
  registryComponent(config) {
    system9.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(
        config.componentName,
        {}
      );
    });
  }
  subscribeEvents(config) {
    world9.beforeEvents.playerInteractWithBlock.subscribe((arg) => {
      inputListener2(arg, config);
    });
    world9.beforeEvents.playerInteractWithBlock.subscribe((arg) => {
      removeListener2(arg);
    });
    world9.beforeEvents.playerBreakBlock.subscribe((arg) => {
      breakListener2(arg);
    });
  }
  /**
   * 创建绑定实例
   * @param config
   * @throws OccultusSDKError 倘若已创建绑定实例
   */
  static create(config) {
    if (_MusicDiscServerBindings.instance) {
      throw new OccultusSDKError("MusicDiscServerBindings already created!");
    }
    _MusicDiscServerBindings.instance = new _MusicDiscServerBindings(config);
  }
  /**
   * 获取绑定实例
   * @returns
   * @throws OccultusSDKError 倘若未创建绑定实例
   */
  static getInstance() {
    if (!_MusicDiscServerBindings.instance) {
      throw new OccultusSDKError("MusicDiscServerBindings not created!");
    }
    return _MusicDiscServerBindings.instance;
  }
};
function breakListener2(event) {
  const block = event.block;
  const player = event.player;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const recordComponent = block.getComponent("record_player");
  if (!recordComponent) return;
  const record = recordComponent.getRecord();
  if (!record) return;
  const sound = MusicDiscServerBindings.getTrackName(record);
  if (sound) {
    system9.run(() => {
      player.runCommand(`stopsound @a ${sound}`);
    });
  }
}
function removeListener2(event) {
  const block = event.block;
  const player = event.player;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const record = block?.getComponent("record_player")?.getRecord();
  if (!record) return;
  const sound = MusicDiscServerBindings.getTrackName(record);
  if (sound) {
    system9.run(() => {
      player.runCommand(`stopsound @a ${sound}`);
    });
  }
}
function inputListener2(event, config) {
  const { player, itemStack, block } = event;
  if (!itemStack) return;
  if (block?.typeId !== "minecraft:jukebox") return;
  if (player?.isSneaking) return;
  const component = itemStack.getComponent(config.componentName);
  if (!component) return;
  const { track_name, artist, name } = component.customComponentParameters.params;
  if (itemStack) {
    if (track_name && !block?.getComponent("record_player")?.isPlaying()) {
      system9.run(() => {
        block.dimension.playSound(track_name, block.location);
        block.dimension.getPlayers({
          location: block.location,
          minDistance: 0,
          maxDistance: 10
        }).forEach((player2) => {
          player2.onScreenDisplay.setActionBar([
            Color.lightPurple,
            {
              translate: "record.nowPlaying",
              with: [`${artist} - ${name}`]
            }
          ]);
        });
      });
    } else if (track_name && block?.getComponent("record_player")?.isPlaying()) {
      system9.run(() => {
        player.runCommand(`stopsound @a ${track_name}`);
      });
    }
  }
}

// ../packages/notification/src/api/UpdateNotification.ts
import { world as world10 } from "@minecraft/server";
var UpdateNotification = class {
  /**
   * 创建更新通知实例
   * @param message 提供通知文本的函数或对象
   * @throws {OccultusSDKError} 当模组尚未初始化时抛出错误
   */
  constructor(message) {
    this.message = message;
    const init = ModManager.getInitializer();
    world10.afterEvents.playerSpawn.subscribe((event) => {
      const version = event.player.getDynamicProperty(
        `${init.getModId()}:playedVersion`
      );
      if (version !== init.getVersion()) {
        this.send(event.player);
        event.player.setDynamicProperty(
          `${init.getModId()}:playedVersion`,
          init.getVersion()
        );
      }
    });
  }
  /**
   * 强制向指定玩家发送更新通知消息
   * @param player 目标玩家对象
   */
  send(player) {
    player.sendMessage(parseText(this.message, player));
  }
};

// ../packages/notification/src/api/WelcomeNotification.ts
import { world as world11 } from "@minecraft/server";
var WelcomeNotification = class {
  /**
   * 创建欢迎通知实例
   * @param message 提供欢迎文本的函数或对象
   */
  constructor(message) {
    this.message = message;
    world11.afterEvents.playerSpawn.subscribe((event) => {
      if (event.initialSpawn) {
        this.send(event.player);
      }
    });
  }
  /**
   * 强制向指定玩家发送欢迎消息
   * @param player 目标玩家对象
   */
  send(player) {
    player.sendMessage(parseText(this.message, player));
  }
};

// ../packages/notification/src/api/Toast.ts
import { world as world12 } from "@minecraft/server";
var Toast = class {
  /**
   * @param content 通知消息，推荐不超过两行
   * @param iconPath 通知图标路径
   */
  constructor(content, iconPath) {
    this.content = content;
    this.iconPath = iconPath;
  }
  /**
   * 向玩家发送吐司通知
   * @param player
   */
  send(player) {
    player.onScreenDisplay.setTitle(
      {
        rawtext: [{ text: "toast:" }, parseToRaw(this.content, player)]
      },
      {
        subtitle: `toast:${this.iconPath}`,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        stayDuration: 1
      }
    );
  }
  /**
   * 向所有玩家发送吐司通知
   */
  sendToWorld() {
    world12.getAllPlayers().forEach((player) => this.send(player));
  }
};

// ../packages/loot/src/api/base/CustomLoot.ts
var CustomLoot = class {
  /**
   * @param typeId 战利品对应的唯一标识符
   * @param path 战利品表对应的路径
   */
  constructor(typeId, path) {
    this.typeId = typeId;
    this.path = path;
  }
};

// ../packages/loot/src/lib/loot.ts
function insertLoot(dimension, blockLocation, path, toolType) {
  if (toolType) {
    dimension.runCommand(
      `loot insert ${blockLocation.x} ${blockLocation.y} ${blockLocation.z} loot "${path}" "${toolType}"`
    );
  } else {
    dimension.runCommand(
      `loot insert ${blockLocation.x} ${blockLocation.y} ${blockLocation.z} loot "${path}"`
    );
  }
}
function loot(dimension, location, path, toolType) {
  if (toolType) {
    dimension.runCommand(
      `loot spawn ${location.x} ${location.y} ${location.z} loot "${path}" "${toolType}"`
    );
  } else {
    dimension.runCommand(
      `loot spawn ${location.x} ${location.y} ${location.z} loot "${path}"`
    );
  }
}

// ../packages/loot/src/api/CustomBlockLoot.ts
var CustomBlockLoot = class extends CustomLoot {
  /**
   * @param typeId 方块的唯一标识符
   * @param path 战利品表文件路径，如`entity/zombie`
   */
  constructor(typeId, path) {
    super(typeId, path);
  }
  /**
   * 在指定位置生成战利品
   * @param dimension 方块所在的维度
   * @param location 生成战利品的坐标位置
   * @param path 战利品表路径，指定使用的战利品配置
   */
  loot(dimension, location, path) {
    loot(dimension, location, path);
  }
};

// ../packages/loot/src/api/CustomEntityLoot.ts
var CustomEntityLoot = class extends CustomLoot {
  /**
   * @param typeId 要添加自定义战利品的实体类型 ID
   * @param path 战利品表的路径
   */
  constructor(typeId, path) {
    super(typeId, path);
  }
  loot(dimension, location, path) {
    loot(dimension, location, path);
  }
};

// ../packages/loot/src/api/CustomLootServer.ts
import { world as world13, system as system10 } from "@minecraft/server";
var CustomLootServer = class {
  /**
   * 存储实体类型ID与对应战利品表路径的映射
   */
  entityLootMap = /* @__PURE__ */ new Map();
  /**
   * 存储方块类型ID与对应战利品表路径的映射
   */
  blockLootMap = /* @__PURE__ */ new Map();
  constructor() {
    world13.afterEvents.entityDie.subscribe((event) => {
      const entity = event.deadEntity;
      const lootTable = this.entityLootMap.get(entity.typeId);
      if (lootTable) {
        loot(entity.dimension, entity.location, lootTable);
      }
    });
    world13.beforeEvents.playerBreakBlock.subscribe((event) => {
      const block = event.block;
      const lootTable = this.blockLootMap.get(block.typeId);
      if (lootTable) {
        system10.run(() => {
          loot(block.dimension, block.location, lootTable);
        });
      }
    });
  }
  /**
   * 添加战利品表配置
   * @param table 自定义战利表对象，可以是方块战利表或实体战利表
   */
  addLoot(table) {
    if (Array.isArray(table)) {
      table.forEach((t) => this.addLoot(t));
      return;
    }
    if (table instanceof CustomBlockLoot) {
      this.blockLootMap.set(table.typeId, table.path);
    }
    if (table instanceof CustomEntityLoot) {
      this.entityLootMap.set(table.typeId, table.path);
    }
  }
};

// ../packages/logger/src/api/Logger.ts
import { world as world15 } from "@minecraft/server";

// ../packages/logger/src/enum/LogLevel.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["Debug"] = -1] = "Debug";
  LogLevel2[LogLevel2["Info"] = 0] = "Info";
  LogLevel2[LogLevel2["Warn"] = 1] = "Warn";
  LogLevel2[LogLevel2["Error"] = 2] = "Error";
  LogLevel2[LogLevel2["Fatal"] = 3] = "Fatal";
  return LogLevel2;
})(LogLevel || {});

// ../packages/logger/src/api/LoggerInternalUtils.ts
import { world as world14 } from "@minecraft/server";

// ../packages/logger/src/data/LogLevelMap.ts
var LogLevelMap = {
  [-1 /* Debug */]: "Debug",
  [0 /* Info */]: "Info",
  [1 /* Warn */]: "Warn",
  [2 /* Error */]: "Error",
  [3 /* Fatal */]: "Fatal"
};

// ../packages/logger/src/api/LoggerInternalUtils.ts
var LoggerInternalUtils = class {
  static getLogLevel(player) {
    if (player) {
      return player.getDynamicProperty("occultus:log_level") ?? 3 /* Fatal */;
    }
    return world14.getDynamicProperty("occultus:log_level") ?? 3 /* Fatal */;
  }
  static setLogLevel(level, player) {
    if (player) {
      player.setDynamicProperty("occultus:log_level", level);
    } else {
      world14.setDynamicProperty("occultus:log_level", level);
    }
  }
  static stringfyMessage(message, level, namespace) {
    const arr = [
      `${Time.getLocalTime(8)} [${LogLevelMap[level]}] [${namespace}] ${message}`
    ];
    if (level === 1 /* Warn */) {
      arr.unshift(Color.gold);
      arr.push(Format.reset);
    }
    if (level === 2 /* Error */ || level === 3 /* Fatal */) {
      arr.unshift(Color.red);
      arr.push(Format.reset);
    }
    return arr.join("");
  }
  static sendLog(message, level, player) {
    if (player) {
      this.sendLogToPlayer(message, player, level);
    } else {
      this.sendLogToWorld(message, level);
    }
  }
  static sendLogToWorld(message, level) {
    if (this.getLogLevel() > level) {
      return;
    }
    world14.sendMessage(message);
  }
  static sendLogToPlayer(message, player, level) {
    if (this.getLogLevel(player) > level) {
      return;
    }
    player.sendMessage(message);
  }
};

// ../packages/logger/src/api/Logger.ts
var Logger = class _Logger {
  /**
   * @param name Logger 的名称
   */
  constructor(name) {
    this.name = name;
  }
  /**
   * 存储日志内容的私有数组
   */
  logContent = [];
  /**
   * 将日志消息添加到历史记录的私有方法
   * @param message - 要添加的日志消息
   */
  addToHistory(message) {
    this.logContent.push(message);
  }
  /**
   * @param name Logger 的名称
   * @returns 返回一个新的 Logger 实例
   */
  static create(name) {
    return new _Logger(name);
  }
  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param player 可选，关联的玩家对象
   * @param namespace 可选，命名空间，默认为Logger的name
   */
  debug(message, player, namespace) {
    const msg = LoggerInternalUtils.stringfyMessage(
      message,
      -1 /* Debug */,
      namespace ?? this.name
    );
    this.addToHistory(msg);
    console.debug(msg);
    LoggerInternalUtils.sendLog(msg, -1 /* Debug */, player);
  }
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param player 可选，关联的玩家对象
   * @param namespace 可选，命名空间，默认为Logger的name
   */
  log(message, player, namespace) {
    const msg = LoggerInternalUtils.stringfyMessage(
      message,
      0 /* Info */,
      namespace ?? this.name
    );
    this.addToHistory(msg);
    console.log(msg);
    LoggerInternalUtils.sendLog(msg, 0 /* Info */, player);
  }
  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param player 可选，关联的玩家对象
   * @param namespace 可选，命名空间，默认为Logger的name
   */
  warn(message, player, namespace) {
    const msg = LoggerInternalUtils.stringfyMessage(
      message,
      1 /* Warn */,
      namespace ?? this.name
    );
    this.addToHistory(msg);
    console.warn(msg);
    LoggerInternalUtils.sendLog(msg, 1 /* Warn */, player);
  }
  /**
   * 记录错误级别日志，并抛出错误
   * @param message 日志消息
   * @param player 可选，关联的玩家对象
   * @param namespace 可选，命名空间，默认为Logger的name
   * @throws 始终抛出一个Error
   */
  error(message, player, namespace) {
    const msg = LoggerInternalUtils.stringfyMessage(
      message,
      2 /* Error */,
      namespace ?? this.name
    );
    this.addToHistory(msg);
    console.error(msg);
    LoggerInternalUtils.sendLog(msg, 2 /* Error */, player);
    throw new Error(msg);
  }
  /**
   * 记录致命错误级别日志，发送消息到世界并抛出错误
   * @param message 日志消息
   * @param player 可选，关联的玩家对象
   * @param namespace 可选，命名空间，默认为Logger的name
   * @throws 始终抛出一个Error
   */
  fatal(message, _player, namespace) {
    const msg = LoggerInternalUtils.stringfyMessage(
      message,
      3 /* Fatal */,
      namespace ?? this.name
    );
    this.addToHistory(msg);
    console.error(msg);
    world15.sendMessage(msg);
    throw new Error(msg);
  }
  /**
   * 获取所有日志历史记录
   * @returns 返回一个包含所有日志的字符串，每条日志以换行符分隔
   */
  getLogHistory() {
    return this.logContent.join("\n");
  }
};

// ../packages/block/src/api/InteractableBlock.ts
var InteractableBlock = class {
  /**
   * @param name 可交互方块的名称，这个名称将会被注册为自定义组件
   */
  constructor(name) {
    this.name = name;
  }
};

// ../packages/block/src/utils/BlockInternalUtils.ts
import { GameMode as GameMode3 } from "@minecraft/server";
var BlockInternalUtils = class _BlockInternalUtils {
  static registryInteractableBlockComponent(block, arg) {
    arg.blockComponentRegistry.registerCustomComponent(block.name, {
      onPlayerInteract(_arg) {
      }
    });
  }
  static registryOreBlockComponent(block, arg) {
    arg.blockComponentRegistry.registerCustomComponent(block.name, {
      onPlayerBreak(callback, param) {
        const p = param.params;
        if (!callback.player) return;
        if (block.onBreak) block.onBreak(callback);
        if (callback.player.getGameMode() === GameMode3.Creative) return;
        if (_BlockInternalUtils.checkCondition(callback.player, p)) {
          loot(callback.dimension, callback.block.location, p.loot_table);
          if (p.exp) callback.player.addExperience(p.exp);
        }
      }
    });
  }
  static registryDestroyCondition(block, arg) {
    arg.blockComponentRegistry.registerCustomComponent(block.name, {
      onPlayerBreak(callback, param) {
        if (!callback.player) return;
        const p = param.params;
        if (callback.player.getGameMode() === GameMode3.Creative) return;
        if (_BlockInternalUtils.checkCondition(callback.player, p)) {
          loot(callback.dimension, callback.block.location, p.loot_table);
          return;
        }
      }
    });
  }
  static checkCondition(player, data) {
    const item = getEquipmentItem(player);
    if (!item) return false;
    if (data.item) return item.typeId === data.item;
    if (data.tag) return item.hasTag(data.tag);
    if (data.item_tier)
      return ItemTier.hasTier(ItemTier.stringfyTier(data.item_tier), item);
    return false;
  }
};

// ../packages/block/src/api/OreBlock.ts
var OreBlock = class {
  /**
   * @param name 矿石方块的名称，这个名称将会被注册为自定义组件
   */
  constructor(name) {
    this.name = name;
  }
  onBreak = () => {
  };
};

// ../packages/block/src/api/BlockWithDestroyCondition.ts
var BlockWithDestroyCondition = class {
  constructor(name) {
    this.name = name;
  }
};

// ../packages/block/src/api/base/BlockRegistries.ts
import { system as system11 } from "@minecraft/server";
var BlockRegistries = class extends Registries {
  constructor() {
    super();
  }
  registry = /* @__PURE__ */ new Map();
  id = "BlockRegistries";
  delete(id) {
    return this.registry.delete(id);
  }
  get(id) {
    return this.registry.get(id);
  }
  has(id) {
    return this.registry.has(id);
  }
  getAll() {
    return Array.from(this.registry.values());
  }
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((v) => this.registry.set(v.name, v));
      return;
    }
    this.registry.set(value.name, value);
  }
  register() {
    system11.beforeEvents.startup.subscribe((init) => {
      this.registry.forEach((value) => {
        if (value instanceof InteractableBlock) {
          BlockInternalUtils.registryInteractableBlockComponent(value, init);
        }
        if (value instanceof OreBlock) {
          BlockInternalUtils.registryOreBlockComponent(value, init);
        }
        if (value instanceof BlockWithDestroyCondition) {
          BlockInternalUtils.registryDestroyCondition(value, init);
        }
      });
    });
  }
};

// ../packages/artifacts/src/api/Artifact.ts
import { MessageFormData as MessageFormData2 } from "@minecraft/server-ui";
var Artifact = class extends FormLike {
  /**
   * @param typeId 饰品的 ID
   * @param name 饰品的名称
   * @param description 饰品的描述
   * @param slot 饰品适用的饰品槽位
   * @param iconPath 饰品的图标路径
   * @param equipmentSound 装备饰品时发送给玩家的声音
   */
  constructor(typeId, name, description, slot, iconPath, equipmentSound = "armor.equip_generic") {
    super();
    this.typeId = typeId;
    this.name = name;
    this.description = description;
    this.slot = slot;
    this.iconPath = iconPath;
    this.equipmentSound = equipmentSound;
  }
  equipEvent = () => {
  };
  hitEntityEvent = () => {
  };
  mineBlockEvent = () => {
  };
  unequipEvent = () => {
  };
  hurtEvent = () => {
  };
  /**
   * 向玩家展示饰品界面
   * @param player 要被展示饰品的界面的玩家
   * @param backTo
   */
  display(player, backTo) {
    const form = new MessageFormData2();
    form.title(parseText(this.name, player));
    form.body(parseText(this.description, player));
    form.button1({ translate: "gui.confirm" });
    form.button2({ translate: "gui.unequip" });
    form.show(player).then((response) => {
      if (response.canceled) {
        this.quit(player, backTo);
        return;
      }
      if (response.selection === 1) {
        this.slot.equipArtifact(player);
      }
      this.quit(player, backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
  onEquip(callback) {
    this.equipEvent = callback;
  }
  onUnequip(callback) {
    this.unequipEvent = callback;
  }
  onHitEntity(callback) {
    this.hitEntityEvent = callback;
  }
  onMineBlock(callback) {
    this.mineBlockEvent = callback;
  }
  onHurt(callback) {
    this.hurtEvent = callback;
  }
};

// ../packages/artifacts/src/api/ArtifactSlot.ts
import {
  ItemStack as ItemStack9,
  system as system12
} from "@minecraft/server";

// ../packages/artifacts/src/utils/ArtifactUtils.ts
var ArtifactUtils = class {
  static getArtifactRegistry() {
    const registry = ModManager.getRegistry(
      "ArtifactRegistries"
    );
    if (!registry) throw new OccultusSDKError("No artifact registry found!");
    return registry;
  }
  static getArtifactSlotRegistry() {
    const registry = ModManager.getRegistry(
      "ArtifactSlotRegistries"
    );
    if (!registry) {
      throw new OccultusSDKError("No artifact slot registry found!");
    }
    return registry;
  }
  static getArtifactSlotName(player, slotName, artifactName) {
    const [slot, artifact] = [
      parseText(slotName, player),
      parseText(artifactName, player)
    ];
    const rawtexts = [];
    rawtexts.push({ text: Color.darkPurple });
    rawtexts.push({ text: "[" });
    rawtexts.push(typeof slot === "string" ? { text: slot } : slot);
    rawtexts.push({ text: "]" });
    rawtexts.push({ text: Format.reset });
    rawtexts.push({ text: " " });
    rawtexts.push(typeof artifact === "string" ? { text: artifact } : artifact);
    return {
      rawtext: rawtexts
    };
  }
};

// ../packages/artifacts/src/api/ArtifactSlot.ts
import { MessageFormData as MessageFormData3 } from "@minecraft/server-ui";
var ArtifactSlot = class extends FormLike {
  constructor(id, name, description, iconPath) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconPath = iconPath;
  }
  display(player, backTo) {
    const form = new MessageFormData3();
    form.title(parseText(this.name, player));
    form.body(parseText(this.description, player));
    form.button1({ translate: "gui.confirm" });
    form.button2({ translate: "gui.cancel" });
    form.show(player).then((_response) => {
      this.quit(player, backTo);
    }).catch((err) => {
      console.log(err);
      this.quit(player, backTo);
    });
  }
  getArtifactId(player) {
    const str = player.getDynamicProperty("starock:artifactSlot." + this.id);
    if (typeof str === "string") return str;
    player.setDynamicProperty("starock:artifactSlot.");
    return;
  }
  getArtifact(player) {
    const id = this.getArtifactId(player);
    if (!id) return;
    return ArtifactUtils.getArtifactRegistry().get(id);
  }
  /**
   * 向饰品槽中装备饰品
   * @param player 要装备饰品的玩家
   * @param artifact 要装备的饰品
   */
  equipArtifact(player, artifact, event) {
    const art = this.getArtifact(player);
    player.setDynamicProperty(
      "starock:artifactSlot." + this.id,
      artifact?.typeId
    );
    system12.waitTicks(5).then(() => {
      if (art) {
        player.dimension.spawnItem(new ItemStack9(art.typeId), player.location);
        art.unequipEvent(player);
      }
      if (event) artifact?.equipEvent(event);
    });
  }
  /**
   * 卸下玩家的饰品
   *
   * **IMPORTANT: 这是一个内部 API，功能残缺**
   * @param player
   * @returns
   */
  unequipArtifact(player) {
    const art = this.getArtifact(player);
    if (!art) return;
    system12.runTimeout(() => {
      player.dimension.spawnItem(new ItemStack9(art.typeId), player.location);
      art.unequipEvent(player);
    }, 10);
  }
};

// ../packages/artifacts/src/api/ArtifactForm.ts
import { system as system14 } from "@minecraft/server";
import { ActionFormData as ActionFormData3 } from "@minecraft/server-ui";

// ../packages/artifacts/src/events/ArtifactEvents.ts
import {
  CustomCommandSource as CustomCommandSource2,
  CustomCommandStatus as CustomCommandStatus2,
  Player as Player17,
  system as system13,
  world as world16
} from "@minecraft/server";
var ArtifactEvents = class _ArtifactEvents {
  static registryConponent(componentName) {
    system13.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(componentName, {
        onUse(arg0, _arg1) {
          _ArtifactEvents.onUse(arg0);
        }
      });
    });
    world16.afterEvents.playerBreakBlock.subscribe((arg) => {
      _ArtifactEvents.onMineBlock(arg);
    });
    world16.afterEvents.entityHitEntity.subscribe((arg) => {
      _ArtifactEvents.onHitEntity(arg);
    });
    world16.afterEvents.entityHurt.subscribe((arg) => {
      _ArtifactEvents.onHurt(arg);
    });
    world16.afterEvents.playerSpawn.subscribe((arg) => {
      if (arg.player.hasTag("artifact_cooldown") && arg.player.isValid) {
        arg.player.removeTag("artifact_cooldown");
      }
    });
  }
  static onUse(arg) {
    const { itemStack, source } = arg;
    if (!itemStack) return;
    if (source.hasTag("artifact_cooldown")) {
      source.onScreenDisplay.setActionBar({
        rawtext: [{ translate: "ui.artifact_cooldown" }]
      });
      return;
    }
    const artifact = ArtifactUtils.getArtifactRegistry().get(itemStack?.typeId);
    if (!artifact) throw new Error("Invalid artifact!");
    setEquipmentItem(source);
    source.playSound(artifact.equipmentSound);
    system13.waitTicks(5).then(() => {
      artifact.slot.equipArtifact(source, artifact, arg);
      const name = parseText(artifact.name, arg.source);
      source.onScreenDisplay.setActionBar({
        rawtext: [
          { translate: "ui.artifact_equipped" },
          typeof name === "string" ? { text: name } : name
        ]
      });
      source.addTag("artifact_cooldown");
      system13.runTimeout(() => {
        if (source.isValid) source.removeTag("artifact_cooldown");
      }, 100);
    });
  }
  static onHitEntity(arg) {
    const { damagingEntity } = arg;
    if (!(damagingEntity instanceof Player17)) return;
    ArtifactUtils.getArtifactSlotRegistry().getAll().forEach((slot) => {
      slot.getArtifact(damagingEntity)?.hitEntityEvent(arg);
    });
  }
  static onMineBlock(arg) {
    const { player } = arg;
    ArtifactUtils.getArtifactSlotRegistry().getAll().forEach((slot) => {
      slot.getArtifact(player)?.mineBlockEvent(arg);
    });
  }
  static onHurt(arg) {
    const { hurtEntity } = arg;
    if (!(hurtEntity instanceof Player17)) return;
    ArtifactUtils.getArtifactSlotRegistry().getAll().forEach((slot) => {
      slot.getArtifact(hurtEntity)?.hurtEvent(arg);
    });
  }
  static registryFormComponent(componentName) {
    system13.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(componentName, {
        onUse(arg0, _arg1) {
          new ArtifactForm().display(arg0.source, []);
        }
      });
    });
  }
  static registryFormCommand(command) {
    system13.beforeEvents.startup.subscribe((arg) => {
      arg.customCommandRegistry.registerCommand(command, (origin) => {
        if (origin.sourceType !== CustomCommandSource2.Entity)
          return {
            status: CustomCommandStatus2.Failure
          };
        if (!(origin.sourceEntity instanceof Player17))
          return {
            status: CustomCommandStatus2.Failure
          };
        new ArtifactForm().display(origin.sourceEntity, []);
        return {
          status: CustomCommandStatus2.Success
        };
      });
    });
  }
};

// ../packages/artifacts/src/api/ArtifactForm.ts
var ArtifactForm = class extends FormLike {
  static addTrigger(itemComponent, command) {
    if (itemComponent) ArtifactEvents.registryFormComponent(itemComponent);
    if (command) ArtifactEvents.registryFormCommand(command);
  }
  constructor() {
    super();
  }
  display(player, backTo) {
    const form = new ActionFormData3();
    form.title({ translate: "ui.artifact" });
    form.body({ translate: "ui.artifact.description" });
    const artifacts = [];
    ArtifactUtils.getArtifactSlotRegistry().getAll().forEach((slot) => {
      const artifact = slot.getArtifact(player);
      if (artifact) {
        form.button(
          ArtifactUtils.getArtifactSlotName(player, slot.name, artifact.name),
          artifact.iconPath
        );
        artifacts.push(artifact);
        return;
      }
      form.button(parseText(slot.name, player), slot.iconPath);
      artifacts.push(slot);
    });
    system14.run(() => {
      form.show(player).then((response) => {
        if (response.canceled || response.selection === void 0) {
          this.quit(player, backTo);
          return;
        }
        this.jumpTo(
          player,
          artifacts[response.selection],
          backTo
        );
      }).catch((err) => {
        console.error(err);
        this.quit(player, backTo);
      });
    });
  }
};

// ../packages/artifacts/src/api/base/ArtifactRegistries.ts
var ArtifactRegistries = class extends Registries {
  constructor(componentName) {
    super();
    this.componentName = componentName;
  }
  artifacts = /* @__PURE__ */ new Map();
  delete(id) {
    return this.artifacts.delete(id);
  }
  get(id) {
    return this.artifacts.get(id);
  }
  has(id) {
    return this.artifacts.has(id);
  }
  getAll() {
    return Array.from(this.artifacts.values());
  }
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((v) => this.add(v));
      return;
    }
    this.artifacts.set(value.typeId, value);
  }
  register() {
    ArtifactEvents.registryConponent(this.componentName);
  }
  id = "ArtifactRegistries";
};

// ../packages/artifacts/src/api/base/ArtifactSlotRegistries.ts
var ArtifactSlotRegistries = class extends Registries {
  artifactsSlots = /* @__PURE__ */ new Map();
  constructor() {
    super();
  }
  delete(id) {
    return this.artifactsSlots.delete(id);
  }
  get(id) {
    return this.artifactsSlots.get(id);
  }
  has(id) {
    return this.artifactsSlots.has(id);
  }
  getAll() {
    return Array.from(this.artifactsSlots.values());
  }
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((v) => this.artifactsSlots.set(v.id, v));
      return;
    }
    this.artifactsSlots.set(value.id, value);
  }
  register() {
    console.log(
      "[OccultusSDK] April fools! ArtifactSlotRegistries.register is not a real API."
    );
  }
  id = "ArtifactSlotRegistries";
};

// ../packages/article/src/lib/utils.ts
import { ItemStack as ItemStack10 } from "@minecraft/server";
import { ActionFormData as ActionFormData5 } from "@minecraft/server-ui";

// ../packages/article/src/api/Article.ts
import { ActionFormData as ActionFormData4 } from "@minecraft/server-ui";
var Article = class _Article extends FormLike {
  /**
   * @param id 文章ID
   * @param title 文章标题
   * @param body 文章内容，支持字符串、RawMessage 和动态生成
   * @param chapters 文章的章节
   * @param iconPath 文章的图标路径
   * @param needUnlock 是否需要解锁
   */
  constructor(id, title, body, chapters, iconPath, needUnlock = true) {
    super();
    this.id = id;
    this.title = title;
    this.body = body;
    this.chapters = chapters;
    this.iconPath = iconPath;
    this.needUnlock = needUnlock;
  }
  static DYNAMIC_DATA_ID = "starock:unlocked_articles";
  /**
   * 向玩家展示文章（文章无章节时）
   * @param player 要展示文章的玩家
   * @param backTo 关闭文章后返回的界面
   * @private
   */
  simpleDisplay(player, backTo) {
    if (!this.checkUnlock(player)) {
      this.unlock(player);
    }
    const [title, body] = [
      parseText(this.title, player),
      parseText(this.body, player)
    ];
    const mainForm = new ActionFormData4().title(title).body(body).button({ translate: "gui.ok" });
    mainForm.show(player).then((response) => {
      if (response.canceled || response.selection === 0) {
        this.quit(player, backTo);
        return;
      }
    }).catch((err) => {
      console.error(`[Article] Failed to display article: ${err}`);
      this.quit(player, backTo);
    });
  }
  /**
   * 向玩家展示文章（文章有章节时）
   * @param player 要展示文章的玩家
   * @param backTo 关闭文章后返回的界面
   * @private
   */
  chapterDisplay(player, backTo) {
    if (!this.checkUnlock(player)) {
      this.unlock(player);
    }
    const [title, body] = [
      parseText(this.title, player),
      parseText(this.body, player)
    ];
    const contentsForm = new ActionFormData4().title(title).body(body);
    this.chapters?.forEach((chapter) => {
      const chapterTitle = parseText(chapter.title, player);
      contentsForm.button(chapterTitle, chapter.iconPath);
    });
    contentsForm.show(player).then((response) => {
      if (response.canceled || response.selection === void 0) {
        this.quit(player, backTo);
        return;
      }
      const [chapterTitle, chapterBody] = [
        parseText(this.chapters[response.selection].title, player),
        parseText(this.chapters[response.selection].body, player)
      ];
      const chapter = new _Article(
        "temp:chapter",
        chapterTitle,
        chapterBody,
        void 0,
        void 0,
        false
      );
      this.jumpTo(player, chapter, backTo);
    }).catch((err) => {
      console.error(`[Article] Failed to display article: ${err}`);
      this.quit(player, backTo);
    });
  }
  /**
   * 向玩家展示文章
   * @param player 要展示文章的玩家
   * @param backTo 关闭文章后返回的界面
   */
  display(player, backTo) {
    if (this.chapters) {
      this.chapterDisplay(player, backTo);
      return;
    }
    this.simpleDisplay(player, backTo);
  }
  /**
   * 在文章中心里解锁文章
   * @param player
   * @return `true`如果文章需要解锁，并且成功解锁；否则返回`false`
   */
  unlock(player) {
    if (!this.needUnlock || this.checkUnlock(player)) return false;
    try {
      const raw = player.getDynamicProperty(_Article.DYNAMIC_DATA_ID);
      let unlockedIds = [];
      if (raw && typeof raw === "string") {
        const parsed = JSON.parse(raw);
        unlockedIds = Array.isArray(parsed) ? parsed : [];
      }
      player.setDynamicProperty(
        _Article.DYNAMIC_DATA_ID,
        JSON.stringify([...unlockedIds, this.id])
      );
      return true;
    } catch (err) {
      console.error(`Failed to unlock article ${this.id}:`, err);
      player.setDynamicProperty(_Article.DYNAMIC_DATA_ID, "[]");
      return false;
    }
  }
  /**
   * 检查文章是否在文章中心里解锁
   * @param player
   */
  checkUnlock(player) {
    if (!this.needUnlock) return true;
    try {
      const raw = player.getDynamicProperty(_Article.DYNAMIC_DATA_ID);
      if (!raw || typeof raw !== "string") return false;
      const json = JSON.parse(raw);
      if (!Array.isArray(json)) return false;
      return json.includes(this.id);
    } catch (err) {
      console.error(`Failed to check status of article ${this.id}:`, err);
    }
    return false;
  }
};

// ../packages/article/src/api/Bindings/ArticleServerBindings.ts
import { system as system15 } from "@minecraft/server";

// ../packages/article/src/api/ArticleCenter.ts
import { MessageFormData as MessageFormData4 } from "@minecraft/server-ui";
var ArticleCenter = class extends FormLike {
  /**
   * @param id 文章中心ID
   * @param title 文章中心标题
   * @param body 文章中心内容
   * @param articleSource 文章来源，如果为`true`，则会从该脚本环境注册的所有文章中显示已经解锁的文章，反之则显示无文章提示，如果为文章列表，则只从提供的文章中显示已解锁的文章
   */
  constructor(id, title, body, articleSource, bindTo, iconPath) {
    super();
    this.id = id;
    this.title = title;
    this.body = body;
    this.articleSource = articleSource;
    this.bindTo = bindTo;
    this.iconPath = iconPath;
  }
  /**
   * 向玩家展示文章中心
   * @param player 要展示文章中心的玩家
   */
  display(player, backTo) {
    const contentForm = generateContentForm(
      player,
      this.title,
      this.body,
      this.getAvailableArticles(player)
    );
    if (!contentForm) {
      this.warn(player, backTo);
      return;
    }
    contentForm.form.show(player).then((response) => {
      if (response.canceled || response.selection === void 0) {
        this.quit(player, backTo);
        return;
      }
      this.jumpTo(player, contentForm.list[response.selection], backTo);
    }).catch((err) => {
      console.error(
        `[ArticleCenter] Failed to display article center: ${err}`
      );
      this.quit(player, backTo);
    });
  }
  getAvailableArticles(player) {
    if (this.articleSource === "registry") {
      if (!this.bindTo) {
        throw new OccultusSDKError(
          "You must bind article registries to the center when using the boolean parameter!"
        );
      }
      return this.bindTo.getAll();
    }
    if (this.articleSource === "auto") {
      return autoGetArticles(player);
    }
    return this.articleSource;
  }
  /**
   * 当没有可用的文章时，向玩家显示警告
   * @param player 被显示提示的玩家
   * @private
   */
  warn(player, backTo) {
    const warningForm = new MessageFormData4().title({ translate: "article.nothing.title" }).body({ translate: "article.nothing.body" }).button1({ translate: "gui.ok" }).button2({ translate: "gui.close" });
    warningForm.show(player).then((_response) => {
      this.quit(player, backTo);
      return;
    }).catch((err) => {
      console.error(`[ArticleCenter] Failed to display warning form: ${err}`);
      this.quit(player, backTo);
    });
  }
};

// ../packages/article/src/api/Bindings/ArticleServerBindings.ts
var ArticleServerBindings = class _ArticleServerBindings {
  constructor(config) {
    this.config = config;
    if (!config) {
      throw new OccultusSDKError("ArticleBindingConfig is required!");
    }
    system15.beforeEvents.startup.subscribe((event) => {
      this.registryArticleComponent(event, config);
      this.registryArticleContentComponent(event, config);
      this.initCenter(config);
      this.registryArticleCenterContent(event, config);
    });
  }
  static instance;
  static center;
  preloadedContent = /* @__PURE__ */ new Map();
  articles = /* @__PURE__ */ new Map();
  initCenter(config) {
    const center = new ArticleCenter(
      "starock:bindings.article_center",
      config.centerConfig.title,
      config.centerConfig.description,
      "auto",
      void 0,
      config.centerConfig.icon_path
    );
    _ArticleServerBindings.center = center;
  }
  registryArticleComponent(event, config) {
    const self = this;
    event.itemComponentRegistry.registerCustomComponent(config.componentName, {
      onUse(event2) {
        const { itemStack, source } = event2;
        if (!itemStack) return;
        if (self.articles.has(itemStack.typeId)) {
          self.articles.get(itemStack.typeId)?.display(source, []);
          return;
        }
        const article = getArticle(itemStack);
        self.articles.set(itemStack.typeId, article);
        article.display(source, []);
      }
    });
  }
  registryArticleContentComponent(event, config) {
    event.itemComponentRegistry.registerCustomComponent(
      config.contentComponentName,
      {}
    );
  }
  registryArticleCenterContent(event, config) {
    event.itemComponentRegistry.registerCustomComponent(
      config.centerComponentName,
      {
        onUse(event2) {
          const { itemStack, source } = event2;
          if (!itemStack) return;
          const center = _ArticleServerBindings.center;
          if (!center) {
            return;
          }
          center.display(source, []);
        }
      }
    );
  }
  /**
   * 创建绑定
   * @param config 
   * @throws OccultusSDKError 如果已经创建过绑定
   */
  static create(config) {
    if (_ArticleServerBindings.instance) {
      throw new OccultusSDKError("ArticleServerBindings already created!");
    }
    _ArticleServerBindings.instance = new _ArticleServerBindings(config);
  }
  static getInstance() {
    if (!_ArticleServerBindings.instance) {
      throw new OccultusSDKError("ArticleServerBindings not created!");
    }
    return _ArticleServerBindings.instance;
  }
  static getCenter() {
    if (!_ArticleServerBindings.center) {
      throw new OccultusSDKError("ArticleCenter not found!");
    }
    return _ArticleServerBindings.center;
  }
  /**
   * 预载文章内容
   * @param id
   * @param content
   */
  preloadContent(id, content) {
    if (!id || !content) {
      console.warn(`Preload data failed with id: ${id}`);
      return;
    }
    this.preloadedContent.set(id, content);
  }
  /**
   * 读取预载文章内容
   * @param id 
   * @return ID 对应的文章预载内容
   */
  readPreloadedContent(id) {
    return this.preloadedContent.get(id);
  }
  getArticle(id) {
    return this.articles.get(id);
  }
};

// ../packages/article/src/lib/utils.ts
function generateContentForm(player, rawTitle, rawBody, articles) {
  const unlockedArticles = [];
  const [title, body] = [
    parseText(rawTitle, player),
    parseText(rawBody, player)
  ];
  const contentForm = new ActionFormData5().title(title).body(body);
  articles.forEach((article) => {
    if (article instanceof Article) {
      if (!article.checkUnlock(player)) {
        return;
      }
      const title3 = parseText(article.title, player);
      contentForm.button(title3, article.iconPath);
      unlockedArticles.push(article);
      return;
    }
    const title2 = parseText(article.title, player);
    contentForm.button(title2, article.iconPath);
    unlockedArticles.push(article);
  });
  if (unlockedArticles.length === 0) {
    return;
  }
  return { form: contentForm, list: unlockedArticles };
}
function articleRegister(componentId, article, arg) {
  arg.itemComponentRegistry.registerCustomComponent(componentId, {
    onUse: (callback) => {
      article.display(callback.source, []);
    }
  });
}
function parseDescription(text) {
  if (typeof text === "string") return text;
  if (Array.isArray(text)) {
    return {
      rawtext: text
    };
  }
  if ("description" in text) {
    return text.description;
  }
  return text;
}
function getArticleContent(item) {
  const config = ArticleServerBindings.getInstance().config;
  const params = item.getComponent(config.contentComponentName)?.customComponentParameters.params;
  if (!params) return;
  if (typeof params === "string") {
    return ArticleServerBindings.getInstance().readPreloadedContent(params);
  }
  return params;
}
function getArticle(item) {
  const config = ArticleServerBindings.getInstance().config;
  const mainParams = item.getComponent(config.componentName)?.customComponentParameters.params;
  const content = getArticleContent(item);
  let article;
  if (!content) {
    throw new OccultusSDKError("Article content not found!");
  }
  if (typeof content !== "string" && "chapter" in content) {
    article = new Article(
      item.typeId,
      mainParams.title,
      content.description,
      content.chapter,
      mainParams.icon_path
    );
    return article;
  }
  article = new Article(
    item.typeId,
    mainParams.title,
    parseDescription(content),
    void 0,
    mainParams.icon_path
  );
  return article;
}
function autoGetArticles(player) {
  try {
    const raw = player.getDynamicProperty(Article.DYNAMIC_DATA_ID);
    if (!raw || typeof raw !== "string") return [];
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) return [];
    return json.map(
      (id) => ArticleServerBindings.getInstance().getArticle(id) ?? getArticle(new ItemStack10(id))
    );
  } catch (e) {
    console.error("Failed to get articles from player:" + e);
  }
  return [];
}

// ../packages/article/src/api/Base/ArticleRegistries.ts
import { system as system16 } from "@minecraft/server";
var ArticleRegistries = class extends Registries {
  id = "ArticleRegistries";
  /**
   * @category Internal
   * @since 1.0.0
   */
  registry = /* @__PURE__ */ new Map();
  add(value) {
    if (Array.isArray(value)) {
      value.forEach((article) => this.add(article));
      return;
    }
    this.registry.set(value.id, value);
  }
  register() {
    system16.beforeEvents.startup.subscribe((arg) => {
      this.registry.forEach((article) => {
        articleRegister(article.id, article, arg);
      });
    });
  }
  delete(id) {
    return this.registry.delete(id);
  }
  /**
   * 获取该注册表下所有文章
   * @returns 一个包含该注册表下所有文章的数组
   */
  getAll() {
    return Array.from(this.registry.values());
  }
  /**
   * 根据文章ID获取文章
   * @param id 文章ID
   * @return 返回找到的文章，如果没有找到则返回`undefined`
   */
  get(id) {
    return this.registry.get(id);
  }
  /**
   * 判断注册表中是否含有某一特定文章
   * @param id 文章的 ID
   * @return 如果含有该文章，则返回`true`，否则返回`false`
   */
  has(id) {
    return this.registry.has(id);
  }
};

// ../packages/tutorial/src/ui/TutorialScreen.ts
import { ActionFormData as ActionFormData6 } from "@minecraft/server-ui";
var TutorialScreen = class {
  static create(origin, player) {
    const form = new ActionFormData6();
    form.title(parseToRaw(origin.name, player));
    if (Array.isArray(origin.body)) {
      origin.body.forEach((text) => {
        form.header(parseToRaw(text.title, player));
        form.label(parseToRaw(text.body, player));
        form.divider();
      });
    } else {
      form.body(parseToRaw(origin.body, player));
    }
    form.button({ translate: "gui.back" });
    return form;
  }
};

// ../packages/tutorial/src/ui/TutorialListScreen.ts
import { ActionFormData as ActionFormData7 } from "@minecraft/server-ui";
var TutorialListScreen = class {
  static create(origin, player) {
    const form = new ActionFormData7();
    form.title(parseToRaw(origin.name, player));
    if (Array.isArray(origin.body)) {
      origin.body.forEach((text) => {
        form.header(parseToRaw(text.title, player));
        form.label(parseToRaw(text.body, player));
        form.divider();
      });
    } else {
      form.body(parseToRaw(origin.body, player));
    }
    form.button({ translate: "gui.back" });
    const arr = [];
    origin.config.tutorials.forEach((tutorial) => {
      if (!tutorial.isAvailable(player)) return;
      form.button(parseToRaw(tutorial.name, player), tutorial.config.iconPath);
      arr.push(tutorial);
    });
    return { form, list: arr };
  }
  static createFromCenter(origin, player) {
    const form = new ActionFormData7();
    form.title(parseToRaw(origin.name, player));
    form.body(parseToRaw(origin.body, player));
    const arr = [];
    origin.tutorials.forEach((tutorial) => {
      if (!tutorial.isAvailable(player)) return;
      form.button(parseToRaw(tutorial.name, player), tutorial.config.iconPath);
      arr.push(tutorial);
    });
    return { form, list: arr };
  }
};

// ../packages/tutorial/src/api/TutorialGroup.ts
var TutorialGroup = class extends FormLike {
  /**
   * @param id 教程组的唯一标识符
   * @param name 教程组的名称
   * @param body 教程组的描述
   * @param config 教程组的相关配置
   */
  constructor(id, name, body, config) {
    super();
    this.id = id;
    this.name = name;
    this.body = body;
    this.config = config;
  }
  /**
   * 检查教程组对指定玩家是否可用
   * @param player 要检查可用性的玩家对象
   * @return 教程组是否对玩家可用
   */
  isAvailable(player) {
    return player.isValid;
  }
  /**
   * 向玩家显示教程组内容
   * @param player 要显示内容的玩家
   * @param backTo 可选的返回对象，用于在玩家取消选择时返回上级界面
   */
  display(player, backTo) {
    const screen = TutorialListScreen.create(this, player);
    screen.form.show(player).then((response) => {
      if (!response.selection) return this.quit(player, backTo);
      const selected = screen.list[response.selection - 1];
      this.jumpTo(player, selected, backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
};

// ../packages/tutorial/src/api/Tutorial.ts
var Tutorial = class _Tutorial extends FormLike {
  /**
   * @param id 教程的唯一标识符
   * @param name 教程的名称
   * @param body 教程的内容
   * @param config 教程的配置对象
   */
  constructor(id, name, body, config) {
    super();
    this.id = id;
    this.name = name;
    this.body = body;
    this.config = config;
  }
  /**
   * 从原始数据解析教程对象
   * @param raw
   * @return
   */
  static parse(raw) {
    if (raw.config.tutorials) {
      const tutorials = [];
      raw.config.tutorials.forEach((element) => {
        const tutorial = _Tutorial.parse(element);
        if (tutorial instanceof _Tutorial) tutorials.push(tutorial);
      });
      return new TutorialGroup(raw.id, raw.name, raw.body, {
        iconPath: raw.config.iconPath,
        tutorials
      });
    }
    try {
      return new _Tutorial(raw.id, raw.name, raw.body, raw.config);
    } catch (err) {
      throw new OccultusSDKError("Failed to parse tutorial:" + raw);
    }
  }
  /** 教程解锁时的回调事件 */
  unlockEvent = () => {
  };
  /**
   * 检查教程对指定玩家是否可用
   * @param player 要检查可用性的玩家对象
   * @return 教程是否可用
   */
  isAvailable(player) {
    if (this.config.type === "alwaysAvailable") return true;
    if (player.getDynamicProperty(`${this.id}.tutorial`) === true) return true;
    return false;
  }
  /**
   * 解锁教程
   * @param player 要为其解锁教程的玩家
   */
  unlock(player) {
    if (this.isAvailable(player)) return;
    player.setDynamicProperty(`${this.id}.tutorial`, true);
    player.playSound(this.config.unlockSound ?? "random.levelup");
    player.onScreenDisplay.setActionBar({
      rawtext: [
        // 已解锁教程：
        { translate: "ui.tutorial.unlock" },
        parseToRaw(this.name, player)
      ]
    });
    this.unlockEvent(player);
  }
  /**
   * 向玩家显示教程内容
   * @param player 要显示教程的玩家
   * @param backTo 可选的返回对象，用于在教程结束后返回上级界面
   */
  display(player, backTo) {
    TutorialScreen.create(this, player).show(player).then((_response) => {
      this.quit(player, backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
  /**
   * 设置教程解锁时的回调函数
   * @param callback 解锁时执行的回调函数，接收玩家对象作为参数
   */
  onUnlock(callback) {
    this.unlockEvent = callback;
  }
};

// ../packages/tutorial/src/api/TutorialCenter.ts
import { system as system18 } from "@minecraft/server";

// ../packages/tutorial/src/utils/TutorialInternalUtils.ts
import {
  system as system17,
  CustomCommandSource as CustomCommandSource3,
  CustomCommandStatus as CustomCommandStatus3,
  Player as Player20
} from "@minecraft/server";
var TutorialUtils = class {
  constructor() {
  }
  static registryComponent(componentName, center) {
    system17.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(componentName, {
        onUse(arg0) {
          center.display(arg0.source, []);
        }
      });
    });
  }
  static registryCommand(command, center) {
    system17.beforeEvents.startup.subscribe((arg) => {
      arg.customCommandRegistry.registerCommand(command, (origin) => {
        system17.run(() => {
          if (origin.sourceType !== CustomCommandSource3.Entity)
            return {
              status: CustomCommandStatus3.Failure
            };
          if (!(origin.sourceEntity instanceof Player20))
            return {
              status: CustomCommandStatus3.Failure
            };
          center.display(origin.sourceEntity, []);
          return {
            status: CustomCommandStatus3.Success
          };
        });
        return {
          status: CustomCommandStatus3.Failure
        };
      });
    });
  }
};

// ../packages/tutorial/src/api/TutorialCenter.ts
var TutorialCenter = class extends FormLike {
  /**
   * @param id 教程中心的唯一标识符
   * @param name 教程中心的名称
   * @param body 教程中心的描述
   * @param tutorials 教程中心要包含的教程与教程组
   */
  constructor(id, name, body, tutorials) {
    super();
    this.id = id;
    this.name = name;
    this.body = body;
    this.tutorials = tutorials;
  }
  openToPlugin() {
    system18.afterEvents.scriptEventReceive.subscribe((arg) => {
      if (arg.id !== `${this.id}.addTutorial`) return;
      if (!arg.message) return;
      try {
        const data = JSON.parse(arg.message);
        this.tutorials.push(Tutorial.parse(data));
      } catch (err) {
        console.warn(`Failed to add tutorial to center ${this.id}!`);
        throw new OccultusSDKError("Invalid tutorial data detected");
      }
    });
  }
  /**
   * 检查教程中心对指定玩家是否可用
   * @param player 要检查可用性的玩家对象
   * @return 教程中心是否对玩家可用
   */
  isAvailable(player) {
    return player.isValid;
  }
  /**
   * 添加触发器，可以通过物品组件或自定义命令来触发教程中心
   * @param itemComponent 可选的物品组件标识符，用于物品触发
   * @param command 可选的自定义命令对象，用于命令触发
   */
  addTrigger(itemComponent, command) {
    if (itemComponent) TutorialUtils.registryComponent(itemComponent, this);
    if (command) TutorialUtils.registryCommand(command, this);
  }
  /**
   * 向玩家显示教程中心内容
   * @param player 要显示内容的玩家
   */
  display(player, backTo) {
    const screen = TutorialListScreen.createFromCenter(this, player);
    screen.form.show(player).then((response) => {
      if (response.canceled || response.selection === void 0)
        return this.quit(player, backTo);
      const selected = screen.list[response.selection];
      this.jumpTo(player, selected, backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
};

// ../packages/tutorial/src/api/base/TutorialServer.ts
import { Player as Player22, world as world17 } from "@minecraft/server";
var TutorialServer = class {
  tutorials = {
    itemMap: /* @__PURE__ */ new Map(),
    // 物品教程映射
    blockMap: /* @__PURE__ */ new Map(),
    // 方块教程映射
    tagMap: /* @__PURE__ */ new Map(),
    // 标签教程映射
    entityMap: /* @__PURE__ */ new Map(),
    // 实体教程映射
    dimensionMap: /* @__PURE__ */ new Map()
    // 维度教程映射
  };
  /**
   * 启动教程服务端
   * @private
   */
  startUp() {
    world17.afterEvents.playerInventoryItemChange.subscribe((arg) => {
      const { itemStack, player } = arg;
      if (!itemStack) return;
      itemStack.getTags().forEach((tag) => {
        if (this.tutorials.tagMap.has(tag)) {
          this.tutorials.tagMap.get(tag)?.unlock(player);
        }
      });
      if (this.tutorials.itemMap.has(itemStack.typeId)) {
        this.tutorials.itemMap.get(itemStack.typeId)?.unlock(player);
      }
    });
    world17.afterEvents.playerBreakBlock.subscribe((arg) => {
      const { brokenBlockPermutation } = arg;
      const id = brokenBlockPermutation.type.id;
      if (this.tutorials.blockMap.has(id)) {
        this.tutorials.blockMap.get(id)?.unlock(arg.player);
      }
    });
    world17.afterEvents.playerPlaceBlock.subscribe((arg) => {
      const { block, player } = arg;
      if (this.tutorials.blockMap.has(block.typeId)) {
        this.tutorials.blockMap.get(block.typeId)?.unlock(player);
      }
    });
    world17.afterEvents.entityHitEntity.subscribe((arg) => {
      const { damagingEntity, hitEntity } = arg;
      if (damagingEntity instanceof Player22) {
        const tutorial = this.tutorials.entityMap.get(hitEntity.typeId);
        if (tutorial) tutorial.unlock(damagingEntity);
        return;
      }
      if (hitEntity instanceof Player22) {
        const tutorial = this.tutorials.entityMap.get(damagingEntity.typeId);
        if (tutorial) tutorial.unlock(hitEntity);
        return;
      }
    });
    world17.afterEvents.playerDimensionChange.subscribe((arg) => {
      const { toDimension, player } = arg;
      if (this.tutorials.dimensionMap.has(toDimension.id)) {
        this.tutorials.dimensionMap.get(toDimension.id)?.unlock(player);
      }
    });
    console.log("[Occultus SDK] Tutorial Server Started");
  }
  /**
   * 初始化教程服务端
   */
  constructor() {
    this.startUp();
  }
  /**
   * 添加教程到教程服务端
   * @param tutorial 要添加的教程
   */
  addTutorial(tutorial) {
    if (Array.isArray(tutorial)) {
      tutorial.forEach((t) => this.addTutorial(t));
      return;
    }
    if (tutorial.id.startsWith("<tag>")) {
      this.tutorials.tagMap.set(tutorial.id.replace("<tag>", ""), tutorial);
      return;
    }
    switch (tutorial.config.type) {
      case "item":
        this.tutorials.itemMap.set(tutorial.id, tutorial);
        break;
      case "block":
        this.tutorials.blockMap.set(tutorial.id, tutorial);
        this.tutorials.itemMap.set(tutorial.id, tutorial);
        break;
      case "entity":
        this.tutorials.entityMap.set(tutorial.id, tutorial);
        break;
      case "dimension":
        this.tutorials.dimensionMap.set(tutorial.id, tutorial);
        break;
    }
  }
};

// ../packages/effect/src/api/VirtualEffect.ts
import { system as system19, world as world18 } from "@minecraft/server";
var VirtualEffect = class {
  /**
   * @param id 状态效果的 ID
   * @param updateTick 设置状态效果更新的间隔，推荐设置的大一些以避免游戏卡顿
   * @param type 状态效果的类型（正面、负面、中性）
   */
  constructor(id, updateTick = 1, type) {
    this.id = id;
    this.updateTick = updateTick;
    this.type = type;
    world18.afterEvents.playerSpawn.subscribe((event) => {
      if (!event.initialSpawn) return;
      const player = event.player;
      player.setDynamicProperty(`${this.id}:runner`, void 0);
      player.setDynamicProperty(`${this.id}:amplifier`, void 0);
    });
  }
  /**
   * 当状态效果更新时的事件
   * @private
   */
  updateEffect;
  /**
   * 当状态效果添加到实体时的事件
   * @private
   */
  addToEntityEffect;
  /**
   * 向实体添加该状态效果
   * @param entity 要添加状态效果的实体
   * @param duration 效果持续时间，以刻为单位 *（20刻=1秒）*
   * @param amplifier 效果的等级（0为代表1级）
   * @return 本次添加操作是否成功
   */
  add(entity, duration, amplifier = 0) {
    if (this.getRunnerId(entity)) {
      return false;
    }
    if (this.addToEntityEffect) {
      if (!entity.isValid) {
        return false;
      }
      this.addToEntityEffect(entity, amplifier);
    }
    const runner = system19.runInterval(() => {
      if (!this.updateEffect) {
        return;
      }
      if (!entity.isValid) {
        return;
      }
      this.updateEffect(entity, amplifier);
    }, this.updateTick);
    entity.setDynamicProperty(`${this.id}:runner`, runner);
    entity.setDynamicProperty(`${this.id}:amplifier`, amplifier);
    system19.runTimeout(() => {
      system19.clearRun(runner);
      if (entity.isValid) {
        entity.setDynamicProperty(`${this.id}:runner`, void 0);
        entity.setDynamicProperty(`${this.id}:amplifier`, void 0);
      }
    }, duration);
    return true;
  }
  /**
   * 向实体移除该状态效果
   * @param entity 要移除效果的实体
   * @return 本次移除操作是否成功
   * @throws 如果 Runner ID 数据类型不是 number 或 undefined，则抛出错误
   */
  remove(entity) {
    if (!entity.isValid) return false;
    if (!this.getRunnerId(entity)) return false;
    const runner = entity.getDynamicProperty(`${this.id}:runner`);
    if (typeof runner !== "number") {
      return false;
    }
    system19.clearRun(runner);
    entity.setDynamicProperty(`${this.id}:runner`);
    return false;
  }
  /**
   * 当状态效果更新时，触发的事件
   * @param event
   */
  onUpdate(event) {
    this.updateEffect = event;
  }
  /**
   * 当状态效果添加到实体时的事件
   * @param event
   */
  onAddToEntity(event) {
    this.addToEntityEffect = event;
  }
  /**
   * 获取该状态效果相关的的 SystemRunner ID
   * @return SystemRunner ID
   * @private
   */
  getRunnerId(entity) {
    const runner = entity.getDynamicProperty(`${this.id}:runner`);
    if (!runner) {
      return void 0;
    }
    if (typeof runner !== "number") {
      throw new Error(
        `Runner ID \u6570\u636E\u7C7B\u578B\u65E0\u6548\uFF0C\u671F\u671B\u7684\u6570\u636E\u7C7B\u578B\uFF1Anumber\uFF0C\u5B9E\u9645\u7684\u6570\u636E\u7C7B\u578B\uFF1A${typeof runner}`
      );
    }
    return runner;
  }
  /**
   * 获取该状态效果的等级
   * @return 实体的状态效果等级
   */
  getAmplifier(entity) {
    const amp = entity.getDynamicProperty(`${this.id}:amplifier`);
    if (!amp) {
      return void 0;
    }
    if (typeof amp !== "number") {
      throw new Error(
        `Amplifier \u6570\u636E\u7C7B\u578B\u65E0\u6548\uFF0C\u671F\u671B\u7684\u6570\u636E\u7C7B\u578B\uFF1Anumber\uFF0C\u5B9E\u9645\u7684\u6570\u636E\u7C7B\u578B\uFF1A${typeof amp}`
      );
    }
    return amp;
  }
};

// ../packages/effect/src/enums/VirtualEffectType.ts
var VirtualEffectType = /* @__PURE__ */ ((VirtualEffectType2) => {
  VirtualEffectType2[VirtualEffectType2["GOOD"] = 0] = "GOOD";
  VirtualEffectType2[VirtualEffectType2["BAD"] = 1] = "BAD";
  VirtualEffectType2[VirtualEffectType2["NEUTRAL"] = 2] = "NEUTRAL";
  return VirtualEffectType2;
})(VirtualEffectType || {});

// ../packages/job/src/api/Job.ts
import {
  system as system21
} from "@minecraft/server";

// ../packages/job/src/utils/JobUtils.ts
import {
  CustomCommandSource as CustomCommandSource4,
  CustomCommandStatus as CustomCommandStatus4,
  ItemLockMode,
  ItemStack as ItemStack11,
  Player as Player23,
  system as system20
} from "@minecraft/server";
var JobInternalUtils = class _JobInternalUtils {
  constructor() {
  }
  static getFormTitle(player, job) {
    const rawtexts = [];
    rawtexts.push({ translate: "ui.job.title" });
    rawtexts.push(parseToRaw(job.name, player));
  }
  /**
   * 获得玩家当前职业的 ID
   * @param player 要查询职业的玩家
   * @returns
   */
  static getJobId(player) {
    const id = player.getDynamicProperty(
      _JobInternalUtils.getDynamicPropertyName()
    );
    if (!id || typeof id !== "string")
      return player.setDynamicProperty(
        _JobInternalUtils.getDynamicPropertyName()
      );
    return id;
  }
  static removeJobSkills(player) {
    const contianer = getContainer(player);
    if (!contianer) throw new Error("Why the player doesn't have a container?");
    for (let i = 0; i < contianer.size; i++) {
      const item = contianer.getItem(i);
      if (!item) continue;
      if (item.hasTag("starock:job_skill")) contianer.setItem(i);
    }
  }
  static giveJobSkills(player, job) {
    if (!job.config.skills) return;
    const items = [];
    for (const skill of job.config.skills) {
      const item = new ItemStack11(skill.typeId);
      item.keepOnDeath = true;
      item.lockMode = ItemLockMode.inventory;
      items.push(item);
    }
    giveItem(player, items);
  }
  static getDynamicPropertyName() {
    return `${ModManager.getInitializer().getModId()}:job`;
  }
  static registryComponent(componentName, center, server) {
    system20.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(componentName, {
        onUse(arg0) {
          center.display(arg0.source, []);
        }
      });
    });
  }
  static getTransformName(job, player) {
    const arr = [];
    job.config.transform?.forEach((item) => {
      arr.push(parseToRaw(item.job.name, player));
      arr.push({ text: " " });
    });
    if (arr.length === 0) return [{ translate: "ui.job.transform.none" }];
    return arr;
  }
  static getSkillName(job, player) {
    const arr = [];
    job.config.skills?.forEach((item) => {
      arr.push(parseToRaw(item.name, player));
      arr.push({ text: " " });
    });
    if (arr.length === 0) return [{ translate: "ui.job.skill.none" }];
    return arr;
  }
  static getUpgradeCost(job, player) {
    const arr = [];
    const level = job.getLevel(player);
    job.config.upgradeCondition.forEach((condition) => {
      if (!NumberRangeUtils.isInRange(level, condition.min, condition.max))
        return;
      condition.condition.forEach((item) => {
        arr.push(parseToRaw(item.getTextProvider(), player));
      });
    });
    if (arr.length === 0) return [{ translate: "ui.job.upgrade_cost.none" }];
    return arr;
  }
  static getUpgradeTooltip(job, player) {
    if (job.getLevel(player) === job.config.maxLevel)
      return { translate: "ui.job.upgrade.max" };
    return {
      rawtext: [
        { translate: "ui.job.upgrade.tooltip" },
        ..._JobInternalUtils.getUpgradeCost(job, player)
      ]
    };
  }
  static registryCommand(command, center, server) {
    system20.beforeEvents.startup.subscribe((arg) => {
      arg.customCommandRegistry.registerCommand(command, (origin) => {
        system20.run(() => {
          if (origin.sourceType !== CustomCommandSource4.Entity)
            return {
              status: CustomCommandStatus4.Failure
            };
          if (!(origin.sourceEntity instanceof Player23))
            return {
              status: CustomCommandStatus4.Failure
            };
          center.display(origin.sourceEntity, []);
          return {
            status: CustomCommandStatus4.Success
          };
        });
        return {
          status: CustomCommandStatus4.Failure
        };
      });
    });
  }
};

// ../packages/job/src/api/Job.ts
var Job = class {
  /**
   * @param id 职业的 ID
   * @param name 职业的显示名称
   * @param body 职业的描述
   * @param config 职业的相关配置
   */
  constructor(id, name, body, config) {
    this.id = id;
    this.name = name;
    this.body = body;
    this.config = config;
  }
  ownEvent = () => {
  };
  hitEntityEvent = () => {
  };
  causeDamageEvent = () => {
  };
  mineBlockEvent = () => {
  };
  upgradeEvent = () => {
  };
  hurtEvent = () => {
  };
  transformEvent = () => {
  };
  projectileHitEvent = () => {
  };
  /**
   * 忽略原有职业，强制向玩家添加该职业
   * @param player
   */
  forceAdd(player) {
    player.setDynamicProperty(
      JobInternalUtils.getDynamicPropertyName(),
      this.id
    );
    system21.waitTicks(10).then(() => {
      player.onScreenDisplay.setActionBar({
        rawtext: [{ translate: "ui.job.get" }, parseToRaw(this.name, player)]
      });
      this.ownEvent(player);
    });
    system21.waitTicks(30).then(() => {
      JobInternalUtils.removeJobSkills(player);
      JobInternalUtils.giveJobSkills(player, this);
    });
  }
  /**
   * 尝试向玩家添加该职业
   * @param player
   * @return 是否添加成功
   */
  add(player) {
    if (!this.canBeAdded(player)) {
      player.onScreenDisplay.setActionBar({
        rawtext: [{ translate: "ui.job.get.fail" }]
      });
      return false;
    }
    this.forceAdd(player);
    return true;
  }
  /**
   * 返回玩家是否拥有该职业
   * @param player
   * @return 玩家是否拥有该职业
   */
  isOwned(player) {
    return JobInternalUtils.getJobId(player) === this.id;
  }
  /**
   * 返回该职业能否被某一玩家获取
   * @param player 要检查的玩家
   * @return 该职业能否被其获取
   */
  canBeAdded(player) {
    if (JobInternalUtils.getJobId(player)) {
      console.log(JobInternalUtils.getJobId(player));
      return false;
    }
    return true;
  }
  /**
   * 返回玩家可以转职的列表
   * @param player
   * @returns
   */
  getTransformList(player) {
    if (!this.config.transform) return [];
    const jobs = [];
    this.config.transform.forEach((tranform) => {
      if (tranform.condition.check(player, true)) jobs.push(tranform.job);
    });
    return jobs;
  }
  getTransformConditionList(player) {
    if (!this.config.transform) return [];
    const conditions = [];
    this.config.transform.forEach((tranform) => {
      if (tranform.condition.check(player, true)) {
        conditions.push(tranform.condition);
      }
    });
    return conditions;
  }
  /**
   * 获取玩家的职业等级
   * @param player
   * @return 玩家的职业等级，默认为 0
   */
  getLevel(player) {
    const level = player.getDynamicProperty(`${this.id}:level`);
    if (!level || typeof level !== "number") return 0;
    return level;
  }
  /**
   * 重置玩家的职业等级
   * @param player
   */
  resetLevel(player) {
    return player.setDynamicProperty(`${this.id}:level`, 0);
  }
  /**
   * 设置玩家的职业等级
   * @param player 要设置等级的玩家
   * @param level 设置的等级
   * @return 玩家新的职业等级
   */
  setLevel(player, level) {
    if (level > this.config.maxLevel)
      throw new RangeError(
        `Invalid level! The maximum level is ${this.config.maxLevel}`
      );
    return player.setDynamicProperty(`${this.id}:level`, level);
  }
  /**
   * 向玩家添加等级
   * @param player 要添加等级的玩家
   * @param level 要添加的等级，默认为 1
   */
  addLevel(player, level = 1) {
    const [lev, max] = [this.getLevel(player), this.config.maxLevel];
    if (lev + level >= max) this.setLevel(player, max);
    this.setLevel(player, lev + level);
  }
  /**
   * 尝试让玩家升级
   * @param player
   */
  tryUpgradeOnce(player) {
    const level = this.getLevel(player);
    if (level >= this.config.maxLevel) return false;
    for (const condition of this.config.upgradeCondition) {
      if (!NumberRangeUtils.isInRange(level, condition.min, condition.max)) {
        continue;
      }
      if (!condition.condition.every((condition2) => condition2.check(player))) {
        continue;
      }
      this.addLevel(player);
      return true;
    }
    return false;
  }
  /**
   * 尝试让玩家升级，其功能对应职业中的「升级」按钮
   * @param player
   * @param count 尝试的升级次数，默认为 1
   */
  upgrade(player, count = 1) {
    const before = this.getLevel(player);
    let addedLevel = 0;
    for (let i = 0; i < count; i++) {
      const result = this.tryUpgradeOnce(player);
      if (result) addedLevel++;
    }
    player.sendMessage({
      translate: "ui.job.upgrade.result",
      with: [count.toString(), addedLevel.toString()]
    });
    this.upgradeEvent({
      recentLevel: this.getLevel(player),
      levelBeforeUpgrade: before,
      player
    });
  }
  /**
   * 对玩家进行转职操作
   * @param player
   * @param job
   * @returns
   */
  transfer(player, job) {
    if (!this.getTransformList(player)) return false;
    job.forceAdd(player);
    this.transformEvent({
      player,
      newJob: job
    });
    return true;
  }
  isReleasingSkills(player) {
    this.config.skills?.forEach((skill) => {
      if (skill.isReleasing(player)) return true;
    });
    return false;
  }
  /**
   * 当玩家使用近战攻击命中实体时触发
   */
  onHitEntity(callback) {
    this.hitEntityEvent = callback;
  }
  /**
   * 当玩家造成伤害时触发
   */
  onCauseDamage(callback) {
    this.causeDamageEvent = callback;
  }
  onMineBlock(callback) {
    this.mineBlockEvent = callback;
  }
  onHurt(callback) {
    this.hurtEvent = callback;
  }
  onOwn(callback) {
    this.ownEvent = callback;
  }
  onUpgrade(callback) {
    this.upgradeEvent = callback;
  }
  onTransform(callback) {
    this.transformEvent = callback;
  }
  /**
   * 当由玩家发射的弹射物击中实体时触发的事件
   * @param callback
   */
  onProjectileHitEntity(callback) {
    this.projectileHitEvent = callback;
  }
};

// ../packages/job/src/ui/JobDetailScreen.ts
import { ModalFormData } from "@minecraft/server-ui";
var JobDetailScreen = class {
  constructor() {
  }
  static create(job, player) {
    const form = new ModalFormData();
    form.title({
      rawtext: [{ translate: "ui.job" }, parseToRaw(job.name, player)]
    });
    const tranform = job.getTransformList(player);
    console.log(tranform);
    form.label(parseToRaw(job.body, player));
    form.label({
      translate: "ui.job.level",
      with: [job.getLevel(player).toString(), job.config.maxLevel.toString()]
    });
    form.label({
      rawtext: [
        { translate: "ui.job.skill" },
        ...JobInternalUtils.getSkillName(job, player)
      ]
    });
    form.label({
      rawtext: [
        { translate: "ui.job.canTransformTo" },
        ...JobInternalUtils.getTransformName(job, player)
      ]
    });
    form.divider();
    form.slider(
      {
        translate: "ui.job.upgrade"
      },
      0,
      job.config.maxLevel - job.getLevel(player),
      {
        tooltip: JobInternalUtils.getUpgradeTooltip(job, player)
      }
    );
    form.dropdown(
      { translate: "ui.job.transform" },
      [
        { translate: "ui.job.transform.none" },
        ...tranform.map((t) => {
          return parseToRaw(t.name, player);
        })
      ],
      { tooltip: "ui.job.transform.tooltip" }
    );
    form.submitButton({ translate: "ui.job.submit" });
    return {
      screen: form,
      transformJobs: tranform,
      conditions: job.getTransformConditionList(player)
    };
  }
};

// ../packages/job/src/api/JobSkill.ts
import { system as system22, world as world19 } from "@minecraft/server";
var JobSkillComponent = class {
  constructor(componentName) {
    this.componentName = componentName;
    this.register();
  }
  register() {
    system22.beforeEvents.startup.subscribe((arg) => {
      arg.itemComponentRegistry.registerCustomComponent(this.componentName, {});
    });
  }
};
var JobSkill = class {
  constructor(typeId, componentName, name, description, lastingTicks) {
    this.typeId = typeId;
    this.componentName = componentName;
    this.name = name;
    this.description = description;
    this.lastingTicks = lastingTicks;
    world19.afterEvents.itemUse.subscribe((arg) => {
      const { source, itemStack } = arg;
      if (itemStack.typeId !== this.typeId) return;
      if (isInCooldown(itemStack, source)) {
        source.onScreenDisplay.setActionBar({
          translate: "skill.cooldown"
        });
        return;
      }
      this.releaseEvent(arg);
      if (this.lastingTicks > 0) {
        this.releasingPlayers.add(source.id);
        system22.runTimeout(() => {
          this.releasingPlayers.delete(source.id);
        }, this.lastingTicks);
      }
      startCooldown(itemStack, source);
    });
  }
  releasingPlayers = /* @__PURE__ */ new Set();
  releaseEvent = () => {
  };
  onRelease(callback) {
    this.releaseEvent = callback;
  }
  isReleasing(player) {
    return this.releasingPlayers.has(player.id);
  }
};

// ../packages/job/src/api/JobServer.ts
import { world as world20 } from "@minecraft/server";

// ../packages/job/src/events/JobEvents.ts
import {
  Player as Player26
} from "@minecraft/server";
var JobEvents = class {
  constructor() {
  }
  static onHitEntity(arg, server) {
    const { damagingEntity } = arg;
    if (!(damagingEntity instanceof Player26)) return;
    const job = server.getJob(damagingEntity);
    if (!job) return;
    job.hitEntityEvent(arg, damagingEntity);
  }
  static onMineBlock(arg, server) {
    const { player } = arg;
    const job = server.getJob(player);
    if (!job) return;
    job.mineBlockEvent(arg, player);
  }
  static onHurt(arg, server) {
    const { hurtEntity } = arg;
    if (!(hurtEntity instanceof Player26)) {
      const damagingEntity = arg.damageSource.damagingEntity;
      if (!(damagingEntity instanceof Player26)) return;
      const job2 = server.getJob(damagingEntity);
      if (!job2) return;
      job2.causeDamageEvent(arg, damagingEntity);
      return;
    }
    const job = server.getJob(hurtEntity);
    if (!job) return;
    job.hurtEvent(arg, hurtEntity);
  }
  static onProjectileHit(arg, server) {
    const { source } = arg;
    if (!(source instanceof Player26)) return;
    const job = server.getJob(source);
    if (!job) return;
    job.projectileHitEvent(arg, source);
  }
};

// ../packages/job/src/api/JobServer.ts
var JobServer = class {
  jobs = /* @__PURE__ */ new Map();
  startUp() {
    world20.afterEvents.playerBreakBlock.subscribe((arg) => {
      JobEvents.onMineBlock(arg, this);
    });
    world20.afterEvents.entityHitEntity.subscribe((arg) => {
      JobEvents.onHitEntity(arg, this);
    });
    world20.afterEvents.entityHurt.subscribe((arg) => {
      JobEvents.onHurt(arg, this);
    });
    world20.afterEvents.projectileHitEntity.subscribe((arg) => {
      JobEvents.onProjectileHit(arg, this);
    });
  }
  constructor() {
    this.startUp();
  }
  addJob(job) {
    this.jobs.set(job.id, job);
  }
  getJob(player) {
    const id = player.getDynamicProperty(
      `${ModManager.getInitializer().getModId()}:job`
    );
    if (typeof id !== "string") return;
    return this.jobs.get(id);
  }
};

// ../packages/job/src/ui/JobNoticeScreen.ts
import { MessageFormData as MessageFormData5 } from "@minecraft/server-ui";
var JobNoticeScreen = class {
  static create() {
    const form = new MessageFormData5();
    form.title({ translate: "ui.job.notice" });
    form.body({ translate: "ui.job.notice.body" });
    form.button1({ translate: "gui.ok" });
    form.button2({ translate: "gui.close" });
    return form;
  }
};

// ../packages/job/src/api/JobCenter.ts
var JobCenter = class extends FormLike {
  constructor(id, bindTo) {
    super();
    this.id = id;
    this.bindTo = bindTo;
  }
  /**
   * 向玩家展示职业中心
   * @param player 要展示的玩家
   */
  display(player, backTo) {
    const job = this.bindTo.getJob(player);
    if (!job) {
      JobNoticeScreen.create().show(player);
      return this.quit(player, backTo);
    }
    const { transformJobs, screen, conditions } = JobDetailScreen.create(
      job,
      player
    );
    screen.show(player).then((response) => {
      if (response.canceled) return this.quit(player, backTo);
      if (!response.formValues) return this.quit(player, backTo);
      const [upgrade, transform] = [
        response.formValues[5],
        response.formValues[6]
      ];
      if (upgrade && typeof upgrade === "number" && upgrade !== 0) {
        this.quit(player, backTo);
        job.upgrade(player, upgrade);
      }
      if (transform && typeof transform === "number" && transform > 0) {
        this.quit(player, backTo);
        job.transfer(player, transformJobs[transform - 1]);
        conditions[transform - 1].check(player);
      }
      this.quit(player, backTo);
    }).catch((err) => {
      console.error(err);
      this.quit(player, backTo);
    });
  }
  addTrigger(itemComponent, command) {
    if (itemComponent)
      JobInternalUtils.registryComponent(itemComponent, this, this.bindTo);
    if (command) JobInternalUtils.registryCommand(command, this, this.bindTo);
  }
};

// ../packages/credits/src/ui/CreditsScreen.ts
import { ActionFormData as ActionFormData8 } from "@minecraft/server-ui";

// ../packages/credits/src/lib/parseCredits.ts
function parseCredits(title, credits) {
  const parsedCredits = [`${title}
`];
  credits.forEach((credit) => {
    if (typeof credit === "string") {
      parsedCredits.push(credit);
      return;
    }
    parsedCredits.push("============");
    parsedCredits.push(credit.discipline);
    parsedCredits.push("============");
    credit.contributors.forEach((contributor) => {
      parsedCredits.push(`${contributor.name} - \xA77\xA7o${contributor.role}\xA7r`);
    });
    parsedCredits.push("\n");
  });
  return parsedCredits.join("\n");
}

// ../packages/credits/src/ui/CreditsScreen.ts
var CreditsScreen = class {
  static display(player, title, data) {
    const creditForm = new ActionFormData8().title({ translate: "ui.credits" }).body(parseCredits(title, data)).button({ translate: "gui.back" });
    creditForm.show(player);
  }
};

// ../packages/credits/src/api/CreditsManager.ts
import {
  CustomCommandSource as CustomCommandSource5,
  CustomCommandStatus as CustomCommandStatus5,
  Player as Player28,
  system as system23
} from "@minecraft/server";
var CreditsManager = class {
  constructor(title, data) {
    this.title = title;
    this.data = data;
  }
  parse() {
    return parseCredits(this.title, this.data);
  }
  /**
   * 注册一个自定义命令使玩家可以看到鸣谢名单
   * @param command
   */
  registerCommand(command) {
    system23.beforeEvents.startup.subscribe((arg) => {
      arg.customCommandRegistry.registerCommand(command, (origin) => {
        system23.run(() => {
          if (origin.sourceType !== CustomCommandSource5.Entity)
            return {
              status: CustomCommandStatus5.Failure
            };
          if (!origin.sourceEntity)
            return {
              status: CustomCommandStatus5.Failure
            };
          if (!(origin.sourceEntity instanceof Player28))
            return {
              status: CustomCommandStatus5.Failure
            };
          CreditsScreen.display(origin.sourceEntity, this.title, this.data);
          return {
            status: CustomCommandStatus5.Success
          };
        });
        return {
          status: CustomCommandStatus5.Success
        };
      });
    });
  }
};

// ../packages/logue/src/api/Monologue.ts
import { system as system24 } from "@minecraft/server";
var Monologue = class {
  /**
   * @param id 该段独白的 ID
   * @param trackId 该段独白的背景音乐
   */
  constructor(id, trackId) {
    this.id = id;
    this.trackId = trackId;
  }
  /**
   * 该独白的所有数据（`delay`为当前段与上一段的间隔时间）
   */
  monologueData = [];
  /**
   * 向玩家播放独白
   * @param player 将要被播放独白的玩家
   */
  play(player) {
    if (!player.isValid)
      throw new OccultusSDKError("Invalid player object!", "Monologue");
    if (this.monologueData.length === 0) {
      console.warn("No monologue data detected!");
      return;
    }
    if (this.trackId) player.playMusic(this.trackId);
    let cumulativeDelay = 0;
    this.monologueData.forEach((config, index) => {
      if (index > 0) cumulativeDelay += config.delay;
      else cumulativeDelay = config.delay;
      const send = () => player.sendMessage(parseText(config.text, player));
      cumulativeDelay === 0 ? send() : system24.runTimeout(send, cumulativeDelay);
    });
  }
  /**
   * 向独白中添加一句独白
   * @param text 独白的文本
   * @param delay 该独白与上一段独白的间隔，以游戏刻为单位
   * @return 当前独白对象
   */
  addMonologue(text, delay) {
    this.monologueData.push({ text, delay });
    return this;
  }
  /**
   * 设置当前所有独白配置
   * @param data 
   * @returns 
   */
  setMonologues(data) {
    this.monologueData = data;
    return this;
  }
  /**
   * 清空所有已添加的独白配置
   */
  clearMonologues() {
    this.monologueData = [];
  }
  /**
   * 获取当前独白数据
   */
  getMonologues() {
    return [...this.monologueData];
  }
};
export {
  Article,
  ArticleCenter,
  ArticleRegistries,
  ArticleServerBindings,
  Artifact,
  ArtifactForm,
  ArtifactRegistries,
  ArtifactSlot,
  ArtifactSlotRegistries,
  BlockEntity,
  BlockRegistries,
  BlockWithDestroyCondition,
  BlockWithEntity,
  Boss,
  BossServer,
  BossSkill,
  Color,
  Conditions,
  CreditsManager,
  CreditsScreen,
  CustomBlockLoot,
  CustomEntityLoot,
  CustomLoot,
  CustomLootServer,
  EffectGroups,
  EntitiesUtils,
  EntityHealthUtils,
  EventList,
  ExpAwards,
  ExpConditions,
  FoodMaterial,
  FormLike,
  Format,
  InteractableBlock,
  ItemAtkSkill,
  ItemAwards,
  ItemConditions,
  ItemRegistries,
  ItemSkill,
  ItemStackData,
  ItemTagConditions,
  ItemTier,
  ItemTiers,
  ItemUseSkill,
  Job,
  JobCenter,
  JobDetailScreen,
  JobServer,
  JobSkill,
  JobSkillComponent,
  KillEntityConditions,
  KillEntityFamilyConditions,
  LevelAwards,
  LevelConditions,
  Localization,
  LogLevel,
  Logger,
  ModInitializer,
  ModManager,
  ModMessageServer,
  Monologue,
  MusicDisc,
  MusicDiscServer,
  MusicDiscServerBindings,
  NumberRangeUtils,
  OccultusCore,
  OccultusSDKError,
  OreBlock,
  Percent,
  PlayerSkill,
  Random,
  RandomEvent,
  Registries,
  Second,
  Skill,
  SkillRegistrires,
  StarTenon,
  Task,
  TaskAwards,
  TaskCenter,
  TaskGroup,
  TaskServer,
  TaskStatus,
  Tick,
  Time,
  TimeSpec,
  Toast,
  ToolMaterial,
  TranslateProvider,
  Tutorial,
  TutorialCenter,
  TutorialGroup,
  TutorialServer,
  UpdateNotification,
  Vector2Utils,
  Vector3Utils,
  VirtualEffect,
  VirtualEffectType,
  WeaponMaterial,
  WelcomeNotification,
  addEffect,
  applyEffectData,
  articleRegister,
  autoGetArticles,
  breakListener2 as breakListener,
  clearEffect,
  clearSlot,
  consumeAmount2 as consumeAmount,
  consumeDurability,
  consumeEquipmentAmount,
  consumeHealth,
  consumeHealthAmplifier,
  effectGroupMap,
  ensureNamespace,
  ensureNoNamespace,
  generateContentForm,
  getAllExp,
  getArticle,
  getArticleContent,
  getContainer,
  getCurrentHealth,
  getEquipmentItem,
  getExpCost,
  getFamilies,
  getItemAmountInContainer,
  getItemAmountOfPlayer,
  getTagItemAmountInContainer,
  giveItem,
  hasFamily,
  heal,
  hexToRgb,
  inputListener2 as inputListener,
  insertLoot,
  isInCooldown,
  loot,
  migrateDamage,
  migrateEnchantments,
  negativeEffectsId,
  neutralEffectsId,
  parseCredits,
  parseDescription,
  parseText,
  parseToRaw,
  parseToRomanNumber,
  positiveEffectsId,
  pushLore,
  removeItemInContainer,
  removeItemOfPlayer,
  removeListener2 as removeListener,
  removeTagItemInContainer,
  replaceItemByTag,
  replaceItemStack,
  rgbToHex,
  setCurrentHealth,
  setEquipmentItem,
  setSlot,
  simpleToRaw,
  startCooldown,
  toOneLine,
  toVec2,
  toVec3,
  tryOperateEntity
};
/**
 * 一些常用的三维向量操作方法
 *
 * @license MIT
 * @author Mojang Studios
 */
/**
 * 一些常用的二维向量操作方法
 *
 * @license MIT
 * @author Mojang Studios
 */
