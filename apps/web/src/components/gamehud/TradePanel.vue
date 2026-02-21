<script setup lang="ts">
import { computed, ref } from "vue";
import { getCharacterVisual } from "../../game/characters/characters";
import { useRoomStore } from "../../stores/roomStore";

const roomStore = useRoomStore();
const showComposer = ref(false);
const targetPlayerId = ref("");
const givePropertyIndexes = ref<number[]>([]);
const takePropertyIndexes = ref<number[]>([]);
const giveCash = ref(0);
const takeCash = ref(0);

const selfPlayerId = computed(() => roomStore.selfPlayerId);
const allPlayers = computed(() => roomStore.players.filter((item) => item.status !== "left"));
const targetCandidates = computed(() => allPlayers.value.filter((item) => item.playerId !== selfPlayerId.value));
const myProperties = computed(() =>
  roomStore.myPropertyIndexes.map((idx) => ({ index: idx, name: roomStore.tilesToRender[idx]?.nameZh ?? `地块${idx}` }))
);
const targetProperties = computed(() => {
  if (!targetPlayerId.value) {
    return [];
  }
  return roomStore.getPlayerPropertyIndexes(targetPlayerId.value).map((idx) => ({
    index: idx,
    name: roomStore.tilesToRender[idx]?.nameZh ?? `地块${idx}`
  }));
});
const targetPlayer = computed(() => allPlayers.value.find((item) => item.playerId === targetPlayerId.value) ?? null);
const maxGiveCash = computed(() => roomStore.selfPlayer?.cash ?? 0);
const maxTakeCash = computed(() => targetPlayer.value?.cash ?? 0);

function openComposer(): void {
  showComposer.value = true;
  targetPlayerId.value = targetCandidates.value[0]?.playerId ?? "";
  givePropertyIndexes.value = [];
  takePropertyIndexes.value = [];
  giveCash.value = 0;
  takeCash.value = 0;
}
function closeComposer(): void {
  showComposer.value = false;
}
function toggleIndex(list: number[], index: number): number[] {
  return list.includes(index) ? list.filter((item) => item !== index) : [...list, index];
}
function toggleGive(index: number): void {
  givePropertyIndexes.value = toggleIndex(givePropertyIndexes.value, index);
}
function toggleTake(index: number): void {
  takePropertyIndexes.value = toggleIndex(takePropertyIndexes.value, index);
}
async function submitTradeOffer(): Promise<void> {
  if (!targetPlayerId.value) {
    return;
  }
  const ok = await roomStore.createTradeOffer({
    targetPlayerId: targetPlayerId.value,
    givePropertyIndexes: givePropertyIndexes.value,
    takePropertyIndexes: takePropertyIndexes.value,
    giveCash: giveCash.value,
    takeCash: takeCash.value,
    giveItems: [],
    takeItems: []
  });
  if (ok) {
    closeComposer();
  }
}
async function handleIncomingDecision(accept: boolean): Promise<void> {
  const offer = roomStore.incomingTradeOffer;
  if (!offer) {
    return;
  }
  await roomStore.respondTradeOffer(offer.tradeId, accept);
}
</script>

<template>
  <section class="trade-panel">
    <header class="head">
      <h3>交易区</h3>
      <button class="launch-btn" type="button" @click="openComposer">发起交易</button>
    </header>
    <div class="mine">
      <p class="label">我的地产</p>
      <div class="chips">
        <span v-for="item in myProperties" :key="item.index" class="chip">{{ item.name }}</span>
        <span v-if="myProperties.length === 0" class="empty">暂无地产</span>
      </div>
    </div>

    <div v-if="showComposer" class="mask" @click.self="closeComposer">
      <section class="modal">
        <header class="modal-head">
          <h4>发起交易</h4>
          <button class="close" type="button" @click="closeComposer">×</button>
        </header>
        <div class="target-list">
          <button
            v-for="player in targetCandidates"
            :key="player.playerId"
            class="target"
            :class="{ active: targetPlayerId === player.playerId }"
            type="button"
            @click="targetPlayerId = player.playerId"
          >
            <img :src="getCharacterVisual(player.selectedCharacterId).avatarUrl" alt="" />
            <span>{{ getCharacterVisual(player.selectedCharacterId).displayName }}</span>
          </button>
        </div>
        <section class="trade-grid">
          <div class="col">
            <p class="col-title">我给出</p>
            <label v-for="item in myProperties" :key="`give-${item.index}`" class="row">
              <input type="checkbox" :checked="givePropertyIndexes.includes(item.index)" @change="toggleGive(item.index)" />
              <span>{{ item.name }}</span>
            </label>
            <p class="item-tip">道具：暂无道具</p>
            <div class="cash-row">
              <span>金额</span>
              <input v-model.number="giveCash" type="range" :max="maxGiveCash" min="0" step="1000" />
              <strong>{{ giveCash }}</strong>
            </div>
          </div>
          <div class="col">
            <p class="col-title">对方给出</p>
            <label v-for="item in targetProperties" :key="`take-${item.index}`" class="row">
              <input type="checkbox" :checked="takePropertyIndexes.includes(item.index)" @change="toggleTake(item.index)" />
              <span>{{ item.name }}</span>
            </label>
            <p class="item-tip">道具：暂无道具</p>
            <div class="cash-row">
              <span>金额</span>
              <input v-model.number="takeCash" type="range" :max="maxTakeCash" min="0" step="1000" />
              <strong>{{ takeCash }}</strong>
            </div>
          </div>
        </section>
        <footer class="foot">
          <button class="btn ghost" type="button" @click="closeComposer">取消</button>
          <button class="btn primary" type="button" :disabled="!targetPlayerId || roomStore.actionPending" @click="submitTradeOffer">
            发送交易
          </button>
        </footer>
      </section>
    </div>

    <div v-if="roomStore.incomingTradeOffer" class="mask" @click.self="roomStore.clearIncomingTradeOffer()">
      <section class="modal">
        <header class="modal-head">
          <h4>交易请求</h4>
          <button class="close" type="button" @click="roomStore.clearIncomingTradeOffer()">×</button>
        </header>
        <p class="summary">
          {{ getCharacterVisual(roomStore.incomingTradeOffer.fromHeroId).displayName }} 向你发起交易
        </p>
        <p class="summary">对方给你：地产 {{ roomStore.incomingTradeOffer.givePropertyIndexes.length }} 个，金额 {{ roomStore.incomingTradeOffer.giveCash }}</p>
        <p class="summary">你需给出：地产 {{ roomStore.incomingTradeOffer.takePropertyIndexes.length }} 个，金额 {{ roomStore.incomingTradeOffer.takeCash }}</p>
        <footer class="foot">
          <button class="btn ghost" type="button" :disabled="roomStore.actionPending" @click="handleIncomingDecision(false)">拒绝</button>
          <button class="btn primary" type="button" :disabled="roomStore.actionPending" @click="handleIncomingDecision(true)">同意</button>
        </footer>
      </section>
    </div>
  </section>
</template>

<style scoped>
.trade-panel { border-radius: 14px; padding: 12px; border: 2px solid rgba(254, 215, 170, 0.85); background: rgba(255, 255, 255, 0.86); }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
h3 { margin: 0; color: #9a3412; }
.launch-btn { border: 0; border-radius: 10px; padding: 7px 10px; color: #fff; background: linear-gradient(180deg, #f59e0b, #ea580c); font-weight: 800; cursor: pointer; }
.label { margin: 0 0 6px; color: #7c2d12; font-size: 13px; font-weight: 700; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 3px 8px; border-radius: 999px; font-size: 12px; background: #ffedd5; color: #7c2d12; }
.empty { font-size: 12px; color: #94a3b8; }
.mask { position: fixed; inset: 0; z-index: 120; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); display: grid; place-items: center; }
.modal { width: min(96vw, 860px); border-radius: 14px; border: 2px solid rgba(253, 186, 116, 0.8); background: #fff; padding: 12px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; }
.modal-head h4 { margin: 0; color: #9a3412; }
.close { border: 0; background: transparent; font-size: 20px; cursor: pointer; }
.target-list { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.target { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; background: #f8fafc; cursor: pointer; }
.target.active { border-color: #0ea5e9; background: #e0f2fe; }
.target img { width: 24px; height: 24px; border-radius: 999px; object-fit: cover; }
.trade-grid { margin-top: 10px; display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
.col { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; min-height: 220px; }
.col-title { margin: 0 0 8px; color: #0f172a; font-weight: 800; }
.row { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 6px; color: #334155; }
.item-tip { margin: 8px 0; font-size: 12px; color: #64748b; }
.cash-row { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; }
.cash-row strong { color: #b45309; }
.summary { margin: 8px 0; color: #334155; }
.foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.btn { border: 0; border-radius: 999px; padding: 8px 14px; font-weight: 800; cursor: pointer; }
.btn.primary { color: #fff; background: linear-gradient(180deg, #f59e0b, #ea580c); }
.btn.ghost { color: #334155; background: #e2e8f0; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
@media (max-width: 820px) { .trade-grid { grid-template-columns: 1fr; } }
</style>
