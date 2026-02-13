<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import EventLyric from "../components/gamehud/EventLyric.vue";
import GameStage from "../components/gamestage/GameStage.vue";
import ItemDock from "../components/gamehud/ItemDock.vue";
import PlayerBar from "../components/gamehud/PlayerBar.vue";
import TradePanel from "../components/gamehud/TradePanel.vue";
import { useRoomStore } from "../stores/roomStore";

const router = useRouter();
const roomStore = useRoomStore();
const lyricRef = ref<InstanceType<typeof EventLyric> | null>(null);

watch(
  () => roomStore.roomStatus,
  async (status) => {
    if (!roomStore.inRoom) {
      await router.replace({ name: "lobby" });
      return;
    }
    if (status === "waiting") {
      await router.replace({ name: "waiting" });
    }
  },
  { immediate: true }
);

watch(
  () => roomStore.diceRolledEvent?.seq,
  () => {
    const payload = roomStore.diceRolledEvent?.payload;
    if (!payload || !lyricRef.value) {
      return;
    }
    lyricRef.value.pushEvent(`${payload.playerId} 掷出了 ${payload.value}`);
  }
);

function pushMockEvent(): void {
  lyricRef.value?.pushEvent(`事件 ${new Date().toLocaleTimeString()}：触发了一次本地模拟`);
}

async function leaveToLobby(): Promise<void> {
  roomStore.backToLobby();
  await router.replace({ name: "lobby" });
}
</script>

<template>
  <section class="game-hud" v-if="roomStore.roomState">
    <header class="top-hud">
      <PlayerBar />
      <div class="ops">
        <button class="btn ghost" type="button" @click="pushMockEvent">模拟事件</button>
        <button class="btn leave" type="button" @click="leaveToLobby">退出房间</button>
      </div>
    </header>

    <section class="hud-grid">
      <aside class="left"><ItemDock /></aside>
      <main class="center"><GameStage /></main>
      <aside class="right">
        <EventLyric ref="lyricRef" />
        <TradePanel />
      </aside>
    </section>
  </section>
</template>

<style scoped>
.game-hud {
  padding: 12px;
  display: grid;
  gap: 10px;
}
.top-hud {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}
.ops {
  display: flex;
  gap: 8px;
}
.btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}
.btn.ghost {
  color: #0f172a;
  background: #dbeafe;
}
.btn.leave {
  color: #fff;
  background: linear-gradient(180deg, #f43f5e, #e11d48);
}
.hud-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 300px;
  gap: 10px;
  align-items: start;
}
.right {
  display: grid;
  gap: 10px;
  grid-template-rows: minmax(280px, 1fr) auto;
}
@media (max-width: 1120px) {
  .hud-grid {
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .right {
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .top-hud {
    grid-template-columns: 1fr;
  }
  .hud-grid {
    grid-template-columns: 1fr;
  }
}
</style>
