<script setup lang="ts">
import { useRouter } from "vue-router";
import JoinRoomModal from "../components/lobby/JoinRoomModal.vue";
import LobbyHero from "../components/lobby/LobbyHero.vue";
import { useRoomStore } from "../stores/roomStore";

const router = useRouter();
const roomStore = useRoomStore();

async function handleJoinConfirm(roomId: string): Promise<void> {
  const ok = await roomStore.joinRoom(roomId);
  if (ok) {
    if (roomStore.roomStatus === "in_game") {
      await router.push({ name: "game", params: { roomId: roomStore.roomId } });
      return;
    }
    await router.push({ name: "waiting" });
  }
}

async function handleCreateRoom(): Promise<void> {
  const ok = await roomStore.createRoom();
  if (ok) {
    await router.push({ name: "waiting" });
  }
}
</script>

<template>
  <section class="lobby-screen">
    <LobbyHero />
    <div class="lobby-card">
      <button class="entry-btn join" type="button" @click="roomStore.openJoinModal">加入房间</button>
      <button class="entry-btn create" type="button" :disabled="roomStore.actionPending" @click="handleCreateRoom">
        {{ roomStore.actionPending ? "正在创建..." : "创建房间" }}
      </button>
      <p v-if="roomStore.localError" class="error">{{ roomStore.localError }}</p>
      <p class="hint">{{ roomStore.connectionHint }}</p>
    </div>
    <JoinRoomModal
      v-model="roomStore.showJoinModal"
      :error-text="roomStore.localError"
      @confirm="handleJoinConfirm"
    />
  </section>
</template>

<style scoped>
.lobby-screen {
  min-height: 100dvh;
  display: grid;
  align-content: center;
  gap: 20px;
  padding: 24px 16px 40px;
}

.lobby-card {
  width: min(620px, 100%);
  margin: 0 auto;
  padding: 26px;
  border-radius: 24px;
  border: 2px solid rgba(255, 255, 255, 0.38);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.19), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(8px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
}

.entry-btn {
  width: 100%;
  border: 0;
  border-radius: 18px;
  padding: 16px 20px;
  margin-bottom: 14px;
  font-size: clamp(22px, 3.4vw, 28px);
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.entry-btn:hover {
  transform: translateY(-2px) scale(1.01);
  filter: saturate(1.08);
}

.entry-btn:active {
  transform: translateY(1px) scale(0.995);
}

.entry-btn.join {
  background: linear-gradient(180deg, #22d3ee, #0891b2);
  box-shadow: 0 10px 0 #0e7490;
}

.entry-btn.create {
  margin-bottom: 4px;
  background: linear-gradient(180deg, #f59e0b, #ea580c);
  box-shadow: 0 10px 0 #c2410c;
}

.hint {
  margin: 14px 0 0;
  text-align: center;
  color: #dbeafe;
  font-size: 14px;
}

.error {
  margin: 6px 0 0;
  color: #fee2e2;
  text-align: center;
  font-weight: 700;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
