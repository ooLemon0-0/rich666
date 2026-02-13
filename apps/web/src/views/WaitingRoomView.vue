<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import CharacterSelectModal from "../components/room/CharacterSelectModal.vue";
import WaitingRoomPanel from "../components/room/WaitingRoomPanel.vue";
import { useRoomStore } from "../stores/roomStore";

const router = useRouter();
const roomStore = useRoomStore();

watch(
  () => roomStore.roomStatus,
  async (status) => {
    if (status === "in_game" && roomStore.roomId) {
      await router.replace({ name: "game", params: { roomId: roomStore.roomId } });
    }
  },
  { immediate: true }
);

async function backLobby(): Promise<void> {
  roomStore.backToLobby();
  await router.push({ name: "lobby" });
}

async function onConfirmCharacter(characterId: string): Promise<void> {
  const ok = await roomStore.selectCharacter(characterId);
  if (ok) {
    roomStore.closeCharacterModal();
  }
}
</script>

<template>
  <section class="waiting-view">
    <header class="view-head">
      <h1>等待区 Waiting Room</h1>
      <button type="button" class="back-btn" @click="backLobby">返回大厅</button>
    </header>

    <WaitingRoomPanel v-if="roomStore.inRoom" />
    <section v-else class="empty-room">
      <p>房间状态未就绪，请返回大厅重新进入。</p>
      <button type="button" class="back-btn" @click="backLobby">返回大厅</button>
    </section>

    <CharacterSelectModal
      :visible="roomStore.showCharacterModal"
      :selected-id="roomStore.selectedCharacterId"
      :taken-by-others="roomStore.takenCharacterIdsByOthers"
      :submit-error="roomStore.localError"
      @confirm="onConfirmCharacter"
      @close="roomStore.closeCharacterModalIfSelected"
    />
  </section>
</template>

<style scoped>
.waiting-view {
  min-height: 100dvh;
  padding: 24px 16px 36px;
  width: min(920px, 100%);
  margin: 0 auto;
}

.view-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 12px;
  color: #fff;
}

h1 {
  margin: 0;
  font-size: clamp(22px, 4.2vw, 32px);
}

.back-btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 700;
  color: #1e3a8a;
  background: #dbeafe;
  cursor: pointer;
}

.empty-room {
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  background: rgba(30, 41, 59, 0.35);
}
</style>
