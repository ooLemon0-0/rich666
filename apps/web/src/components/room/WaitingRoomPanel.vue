<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoomStore } from "../../stores/roomStore";
import PlayerList from "./PlayerList.vue";

const roomStore = useRoomStore();
const copied = ref(false);
const copiedText = ref("");

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
  try {
    await navigator.clipboard.writeText(buildInviteUrl(roomStore.roomId));
    copied.value = true;
    copiedText.value = "已复制，发给好友即可直接进入";
    window.setTimeout(() => {
      copied.value = false;
      copiedText.value = "";
    }, 1200);
  } catch {
    roomStore.localError = "复制失败，请手动复制邀请链接";
  }
}

function handleModifyRole(): void {
  roomStore.openCharacterModal();
}
</script>

<template>
  <section class="waiting-panel">
    <header class="top">
      <div>
        <p class="label">房间铭牌</p>
        <h2>{{ roomStore.roomId }}</h2>
        <p class="count">玩家：{{ roomStore.connectedPlayersCount }}/{{ roomStore.maxPlayers }}</p>
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

    <div class="tips">
      <p>连接状态：{{ roomStore.connectionHint }}</p>
      <p v-if="roomStore.localError" class="error">{{ roomStore.localError }}</p>
    </div>
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
</style>
