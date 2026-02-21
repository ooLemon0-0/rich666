<script setup lang="ts">
import { computed, ref } from "vue";
import type { ItemId } from "@rich/shared";
import { getCharacterVisual } from "../../game/characters/characters";
import { useRoomStore } from "../../stores/roomStore";

const roomStore = useRoomStore();
const selectedItem = ref<ItemId | null>(null);
const targetPlayerId = ref("");
const desiredDice = ref(6);
const selectedTileIndex = ref<number | null>(null);
const ITEM_NAME_MAP: Record<ItemId, string> = {
  any_dice: "任意骰子",
  steal_card: "抢夺卡",
  turtle_card: "乌龟卡",
  outlaw_card: "落草为寇",
  god_bless: "请神术",
  banish_god: "送神术",
  auction_card: "拍卖卡",
  build_card: "建筑卡",
  equal_poor_card: "均贫卡",
  equal_rich_card: "均富卡",
  nanman_card: "南蛮入侵",
  frame_card: "陷害卡"
};
const ITEM_EFFECT_MAP: Record<ItemId, string> = {
  any_dice: "指定本回合骰子点数（1-6）。",
  steal_card: "夺取4格内目标的随机1个道具。",
  turtle_card: "令目标接下来3回合固定掷出1点。",
  outlaw_card: "下次遭遇其他角色时抢走其15%金钱。",
  god_bless: "随机请神上身5回合，触发对应神力。",
  banish_god: "送走自己或4格内目标身上的神。",
  auction_card: "将当前位置地产打回平地并清空归属。",
  build_card: "指定自己的地产免费升级1级。",
  equal_poor_card: "让目标金钱降到与最穷者一致。",
  equal_rich_card: "让自己金钱升到与最富者一致。",
  nanman_card: "全员损失 其地产数量×100 金。",
  frame_card: "将4格内目标送入监狱3回合。"
};

const isMyTurn = computed(
  () =>
    roomStore.roomStatus === "in_game" &&
    roomStore.currentTurnPlayerId === roomStore.selfPlayerId &&
    roomStore.roomState?.phase === "rolling"
);
const targetCandidates = computed(() => {
  if (
    selectedItem.value === "turtle_card" ||
    selectedItem.value === "banish_god" ||
    selectedItem.value === "equal_poor_card" ||
    selectedItem.value === "frame_card"
  ) {
    return roomStore.players.filter((item) => item.status === "active");
  }
  return roomStore.players.filter((item) => item.playerId !== roomStore.selfPlayerId && item.status === "active");
});
const buildableTiles = computed(() =>
  roomStore.myPropertyIndexes.map((idx) => {
    const tile = roomStore.tilesToRender[idx];
    return {
      index: idx,
      name: tile?.nameZh ?? tile?.name ?? `地块${idx}`
    };
  })
);

function itemCount(itemId: ItemId): number {
  return roomStore.selfItems.find((item) => item.itemId === itemId)?.count ?? 0;
}
function itemLabel(itemId: ItemId): string {
  return ITEM_NAME_MAP[itemId] ?? itemId;
}
function itemEffect(itemId: ItemId): string {
  return ITEM_EFFECT_MAP[itemId] ?? "未知道具效果。";
}
function openUse(itemId: ItemId): void {
  selectedItem.value = itemId;
  targetPlayerId.value = targetCandidates.value[0]?.playerId ?? "";
  desiredDice.value = 6;
  selectedTileIndex.value = buildableTiles.value[0]?.index ?? null;
}
async function confirmUse(): Promise<void> {
  if (!selectedItem.value) {
    return;
  }
  const payload: { itemId: ItemId; targetPlayerId?: string; targetTileIndex?: number; desiredDice?: number } = {
    itemId: selectedItem.value
  };
  if (selectedItem.value === "any_dice") {
    payload.desiredDice = desiredDice.value;
  }
  if (
    selectedItem.value === "steal_card" ||
    selectedItem.value === "turtle_card" ||
    selectedItem.value === "banish_god" ||
    selectedItem.value === "equal_poor_card" ||
    selectedItem.value === "frame_card"
  ) {
    payload.targetPlayerId = targetPlayerId.value;
  }
  if (selectedItem.value === "build_card" && selectedTileIndex.value !== null) {
    payload.targetTileIndex = selectedTileIndex.value;
  }
  const ok = await roomStore.useItem(payload);
  if (ok) {
    selectedItem.value = null;
  }
}
</script>

<template>
  <section class="dock">
    <h3>道具区</h3>
    <p>仅在你的回合可使用</p>
    <div class="slots">
      <button class="slot" :disabled="itemCount('any_dice') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('any_dice')">
        <span>任意骰子</span><strong>x{{ itemCount("any_dice") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('steal_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('steal_card')">
        <span>抢夺卡</span><strong>x{{ itemCount("steal_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('turtle_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('turtle_card')">
        <span>乌龟卡</span><strong>x{{ itemCount("turtle_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('outlaw_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('outlaw_card')">
        <span>落草为寇</span><strong>x{{ itemCount("outlaw_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('god_bless') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('god_bless')">
        <span>请神术</span><strong>x{{ itemCount("god_bless") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('banish_god') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('banish_god')">
        <span>送神术</span><strong>x{{ itemCount("banish_god") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('auction_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('auction_card')">
        <span>拍卖卡</span><strong>x{{ itemCount("auction_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('build_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('build_card')">
        <span>建筑卡</span><strong>x{{ itemCount("build_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('equal_poor_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('equal_poor_card')">
        <span>均贫卡</span><strong>x{{ itemCount("equal_poor_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('equal_rich_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('equal_rich_card')">
        <span>均富卡</span><strong>x{{ itemCount("equal_rich_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('nanman_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('nanman_card')">
        <span>南蛮入侵</span><strong>x{{ itemCount("nanman_card") }}</strong>
      </button>
      <button class="slot" :disabled="itemCount('frame_card') <= 0 || !isMyTurn || roomStore.actionPending" @click="openUse('frame_card')">
        <span>陷害卡</span><strong>x{{ itemCount("frame_card") }}</strong>
      </button>
    </div>

    <div v-if="selectedItem" class="mask" @click.self="selectedItem = null">
      <section class="modal">
        <h4>使用道具</h4>
        <p>道具：{{ selectedItem ? itemLabel(selectedItem) : "" }}</p>
        <p v-if="selectedItem" class="item-effect">效果：{{ itemEffect(selectedItem) }}</p>
        <label v-if="selectedItem === 'any_dice'" class="row">
          <span>指定点数</span>
          <input v-model.number="desiredDice" type="range" min="1" max="6" step="1" />
          <strong>{{ desiredDice }}</strong>
        </label>
        <div
          v-if="selectedItem === 'steal_card' || selectedItem === 'turtle_card' || selectedItem === 'banish_god' || selectedItem === 'equal_poor_card' || selectedItem === 'frame_card'"
          class="target-pick"
        >
          <span class="pick-label">目标角色</span>
          <div class="avatars">
            <button
              v-for="player in targetCandidates"
              :key="player.playerId"
              class="avatar-btn"
              :class="{ active: targetPlayerId === player.playerId }"
              type="button"
              @click="targetPlayerId = player.playerId"
            >
              <img :src="getCharacterVisual(player.selectedCharacterId).avatarUrl" alt="" />
              <span>{{ getCharacterVisual(player.selectedCharacterId).displayName }}</span>
            </button>
          </div>
        </div>
        <div v-if="selectedItem === 'build_card'" class="target-pick">
          <span class="pick-label">目标地产</span>
          <div class="avatars">
            <button
              v-for="tile in buildableTiles"
              :key="tile.index"
              class="avatar-btn"
              :class="{ active: selectedTileIndex === tile.index }"
              type="button"
              @click="selectedTileIndex = tile.index"
            >
              <span>{{ tile.name }}</span>
            </button>
          </div>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" @click="selectedItem = null">取消</button>
          <button
            class="btn primary"
            type="button"
            :disabled="
              roomStore.actionPending ||
              (((selectedItem === 'steal_card' || selectedItem === 'turtle_card' || selectedItem === 'banish_god' || selectedItem === 'equal_poor_card' || selectedItem === 'frame_card') && !targetPlayerId)) ||
              (selectedItem === 'build_card' && selectedTileIndex === null)
            "
            @click="confirmUse"
          >
            确认使用
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dock { border-radius: 14px; padding: 12px; border: 2px solid rgba(186, 230, 253, 0.8); background: rgba(255, 255, 255, 0.86); }
h3 { margin: 0 0 6px; color: #0c4a6e; }
p { margin: 0 0 10px; color: #475569; font-size: 13px; }
.item-effect { margin-top: -4px; color: #0f172a; font-weight: 600; }
.slots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.slot { display: flex; justify-content: space-between; align-items: center; height: 44px; border-radius: 10px; border: 1px dashed #7dd3fc; color: #0284c7; font-weight: 700; background: #f0f9ff; padding: 0 10px; cursor: pointer; }
.slot:disabled { opacity: 0.5; cursor: not-allowed; }
.mask { position: fixed; inset: 0; z-index: 130; display: grid; place-items: center; background: rgba(15, 23, 42, 0.35); }
.modal { width: min(92vw, 420px); border-radius: 12px; background: #fff; border: 1px solid #cbd5e1; padding: 12px; }
.modal h4 { margin: 0 0 6px; color: #0f172a; }
.row { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-top: 8px; }
select { width: 100%; }
.target-pick { margin-top: 8px; }
.pick-label { display: block; margin-bottom: 6px; color: #334155; font-size: 13px; font-weight: 700; }
.avatars { display: flex; gap: 8px; flex-wrap: wrap; }
.avatar-btn { border: 1px solid #cbd5e1; border-radius: 10px; padding: 4px 8px; background: #f8fafc; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.avatar-btn.active { border-color: #0ea5e9; background: #e0f2fe; }
.avatar-btn img { width: 24px; height: 24px; border-radius: 999px; object-fit: cover; }
.avatar-btn span { font-size: 12px; color: #0f172a; font-weight: 700; }
.actions { margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px; }
.btn { border: 0; border-radius: 999px; padding: 8px 12px; font-weight: 800; cursor: pointer; }
.btn.primary { background: linear-gradient(180deg, #0ea5e9, #0284c7); color: #fff; }
.btn.ghost { background: #e2e8f0; color: #334155; }
</style>
