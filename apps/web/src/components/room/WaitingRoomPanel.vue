<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoomStore } from "../../stores/roomStore";
import PlayerList from "./PlayerList.vue";
import ManualCopyModal from "./ManualCopyModal.vue";
import { copyTextWithFallback } from "../../utils/copyText";

const roomStore = useRoomStore();
const copied = ref(false);
const copiedText = ref("");
const showManualCopyModal = ref(false);
const inviteUrl = computed(() => (roomStore.roomId ? buildInviteUrl(roomStore.roomId) : ""));
const initialCashDraft = ref(15_000);

const readyButtonText = computed(() => {
  return roomStore.selfPlayer?.ready ? "取消准备" : "准备";
});

function buildInviteUrl(roomId: string): string {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${window.location.origin}${normalizedBase}#/room/${roomId}`;
}

async function copyInviteUrl(): Promise<void> {
  if (!roomStore.roomId) {
    return;
  }
  const ok = await copyTextWithFallback(buildInviteUrl(roomStore.roomId));
  if (ok) {
    copied.value = true;
    copiedText.value = "已复制邀请链接";
    roomStore.localError = "";
    window.setTimeout(() => {
      copied.value = false;
      copiedText.value = "";
    }, 1200);
  } else {
    copied.value = false;
    copiedText.value = "复制失败，请手动复制链接";
    roomStore.localError = "复制失败，请手动复制链接";
    showManualCopyModal.value = true;
  }
}

function handleModifyRole(): void {
  roomStore.openCharacterModal();
}

async function handleInitialCashChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }
  const value = Number(target.value);
  if (!Number.isFinite(value)) {
    return;
  }
  initialCashDraft.value = value;
  await roomStore.setInitialCash(value);
}

function handleInitialCashInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }
  const value = Number(target.value);
  if (!Number.isFinite(value)) {
    return;
  }
  initialCashDraft.value = value;
}

watch(
  () => roomStore.initialCash,
  (next) => {
    initialCashDraft.value = next;
  },
  { immediate: true }
);
</script>

<template>
  <section class="waiting-panel">
    <header class="top">
      <div>
        <p class="label">房间铭牌</p>
        <h2>{{ roomStore.roomId }}</h2>
        <p class="count">玩家：{{ roomStore.connectedPlayersCount }}/{{ roomStore.maxPlayers }}</p>
        <p class="count spectator">观战：{{ roomStore.roomState?.spectators?.filter((s) => s.connected).length ?? 0 }}</p>
      </div>
      <button class="copy-btn" type="button" @click="copyInviteUrl">
        {{ copied ? "已复制" : "复制邀请链接" }}
      </button>
    </header>
    <p v-if="copiedText" class="copy-tip">{{ copiedText }}</p>

    <PlayerList
      :players="roomStore.players"
      :self-player-id="roomStore.selfPlayerId"
      :host-player-id="roomStore.roomState?.hostPlayerId ?? ''"
      @modify-role="handleModifyRole"
    />

    <footer class="actions">
      <button
        v-if="roomStore.selfRole === 'player'"
        class="action ready"
        type="button"
        :disabled="!roomStore.canReady || roomStore.actionPending"
        @click="() => roomStore.toggleReady()"
      >
        {{ roomStore.canReady ? readyButtonText : "请先选择角色" }}
      </button>
      <button
        v-if="roomStore.isHost"
        class="action start"
        type="button"
        :disabled="roomStore.startButtonDisabled || roomStore.actionPending"
        @click="() => roomStore.startGame()"
      >
        {{ roomStore.startButtonLabel }}
      </button>
    </footer>

    <section v-if="roomStore.isHost && roomStore.roomStatus === 'waiting'" class="cash-panel">
      <div class="cash-head">
        <span>初始金钱</span>
        <strong>{{ initialCashDraft.toLocaleString() }}</strong>
      </div>
      <input
        class="cash-slider"
        type="range"
        min="15000"
        max="100000"
        step="1000"
        :value="initialCashDraft"
        :disabled="roomStore.actionPending"
        @input="handleInitialCashInput"
        @change="handleInitialCashChange"
      />
      <div class="cash-scale">
        <span>15,000</span>
        <span>100,000</span>
      </div>
    </section>

    <div class="tips">
      <p v-if="roomStore.selfRole === 'spectator'" class="spectator-tip">当前为观战模式，无法掷骰或购买。</p>
      <p v-if="roomStore.systemMessages[0]" class="sys-msg">{{ roomStore.systemMessages[0].text }}</p>
      <p>连接状态：{{ roomStore.connectionHint }}</p>
      <p v-if="roomStore.localError" class="error">{{ roomStore.localError }}</p>
    </div>

    <ManualCopyModal :visible="showManualCopyModal" :text="inviteUrl" @close="showManualCopyModal = false" />
  </section>
</template>

<style scoped>
.waiting-panel {
  border-radius: 24px;
  padding: 20px;
  border: 2px solid rgba(255, 255, 255, 0.44);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(6px);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.2);
}

.top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.label {
  margin: 0;
  color: #1e3a8a;
  font-size: 13px;
}

h2 {
  margin: 2px 0 0;
  color: #0f172a;
  letter-spacing: 0.18em;
}

.count {
  margin: 4px 0 0;
  color: #334155;
  font-weight: 700;
  font-size: 13px;
}
.count.spectator {
  color: #0369a1;
}

.copy-tip {
  margin: -4px 0 10px;
  color: #065f46;
  font-size: 13px;
  font-weight: 700;
}

.copy-btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  color: #fff;
  background: linear-gradient(180deg, #06b6d4, #0284c7);
  cursor: pointer;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.action {
  border: 0;
  border-radius: 12px;
  padding: 11px 14px;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.action.ready {
  background: linear-gradient(180deg, #2563eb, #1d4ed8);
}

.action.start {
  background: linear-gradient(180deg, #f59e0b, #ea580c);
}

.action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cash-panel {
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.25);
  background: rgba(236, 254, 255, 0.68);
  padding: 10px 12px;
}
.cash-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 8px;
}
.cash-slider {
  width: 100%;
}
.cash-scale {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #155e75;
}

.tips {
  margin-top: 10px;
  color: #334155;
  font-size: 14px;
}

.tips p {
  margin: 0;
}

.error {
  margin-top: 4px;
  color: #dc2626;
  font-weight: 700;
}
.spectator-tip {
  margin-bottom: 4px !important;
  color: #0369a1;
  font-weight: 700;
}
.sys-msg {
  margin-bottom: 4px !important;
  color: #7c3aed;
  font-weight: 700;
}
</style>
