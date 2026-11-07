import { system } from "@minecraft/server";
import { MessageBox } from "@minecraft/server-ui";
import { grantSeal, hasSeal, notifyBind } from "./index.js";
import { displayMessage, messageChannels } from "../messageManager.js";

const SEAL_ITEM = "stonecraft:septem_seal_stone";
const SEAL_COMPONENT = "stonecraft:septem_seal";

const KEY = {
  title: "stonecraft.septem.title",
  body: "stonecraft.septem.body",
  ok: "stonecraft.septem.ok",
  cancel: "stonecraft.septem.cancel",
  already: "stonecraft.septem.already",
  noItem: "stonecraft.septem.no_item",
  failed: "stonecraft.septem.failed",
  doneTitle: "stonecraft.septem.done_title",
  doneBody: "stonecraft.septem.done_body",
};

const pending = new Set();

const msg = (key) => ({ translate: key });

//七咒的播报属于正式信息，走聊天栏通道
const notify = (player, key) =>
  displayMessage(player, msg(key), { channel: messageChannels.chat });

//CustomForm 的 button 回调不会关闭表单，所以这里用 MessageBox：
//它靠 show() 的返回值判断，选中 button1 = 1，button2 = 2，关闭为 undefined
function showConfirm(player, onAccept) {
  if (pending.has(player.id)) return;
  pending.add(player.id);

  const done = () => pending.delete(player.id);

  new MessageBox(player, msg(KEY.title))
    .body(msg(KEY.body))
    .button1(msg(KEY.ok))
    .button2(msg(KEY.cancel))
    .show()
    .then((response) => {
      done();
      if (response?.selection === 1) onAccept();
    })
    .catch(() => done());
}

function consumeSelected(player) {
  try {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    const slot = player.selectedSlotIndex;
    const item = container.getItem(slot);
    if (!item || item.typeId !== SEAL_ITEM) return false;
    if (item.amount > 1) {
      item.amount -= 1;
      container.setItem(slot, item);
    } else {
      container.setItem(slot, undefined);
    }
    return true;
  } catch {
    return false;
  }
}

function applySeal(player) {
  if (!player?.isValid) return;
  if (hasSeal(player)) {
    notify(player, KEY.already);
    return;
  }
  if (!consumeSelected(player)) {
    notify(player, KEY.noItem);
    return;
  }
  if (!grantSeal(player)) {
    notify(player, KEY.failed);
    return;
  }
  notify(player, KEY.doneTitle);
  notify(player, KEY.doneBody);
  try {
    player.playSound("mob.wither.spawn", { volume: 1, pitch: 0.7 });
  } catch {
  }
  notifyBind(player);
}

function onSealUsed(event) {
  const player = event.source;
  if (player?.typeId !== "minecraft:player") return;
  if (hasSeal(player)) {
    notify(player, KEY.already);
    return;
  }
  system.run(() => {
    if (!player.isValid) return;
    showConfirm(player, () => applySeal(player));
  });
}

system.beforeEvents.startup.subscribe((init) => {
  try {
    if (!init?.itemComponentRegistry) {
      console.error("[SevenCurses] itemComponentRegistry is unavailable");
      return;
    }
    init.itemComponentRegistry.registerCustomComponent(SEAL_COMPONENT, {
      onUse: (event) => onSealUsed(event),
    });
  } catch (error) {
    console.error("[SevenCurses] seal component registration failed:", error);
  }
});
