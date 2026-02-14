<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import EventLyric from "../components/gamehud/EventLyric.vue";
import GameStage from "../components/gamestage/GameStage.vue";
import ItemDock from "../components/gamehud/ItemDock.vue";
import PlayerBar from "../components/gamehud/PlayerBar.vue";
import TradePanel from "../components/gamehud/TradePanel.vue";
import ConfirmModal from "../components/ui/ConfirmModal.vue";
import { useRoomStore } from "../stores/roomStore";

const router = useRouter();
const roomStore = useRoomStore();
const lyricRef = ref<InstanceType<typeof EventLyric> | null>(null);
const showExitConfirm = ref(false);
const prevSpectatorConnected = ref(new Set<string>());
const connectedSpectatorCount = computed(
  () => roomStore.roomState?.spectators?.filter((item) => item.connected).length ?? 0
);

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
  () => roomStore.systemMessages[0]?.id,
  () => {
    const latest = roomStore.systemMessages[0];
    if (!latest || !lyricRef.value) {
      return;
    }
    lyricRef.value.pushEvent(latest.text);
  }
);

watch(
  () =>
    (roomStore.roomState?.spectators ?? [])
      .filter((item) => item.connected)
      .map((item) => item.spectatorId)
      .sort(),
  (nextIds) => {
    if (!lyricRef.value) {
      prevSpectatorConnected.value = new Set(nextIds);
      return;
    }
    const prev = prevSpectatorConnected.value;
    const next = new Set(nextIds);
    nextIds.forEach((id) => {
      if (!prev.has(id)) {
        lyricRef.value?.pushEvent(`观战玩家 ${id} 已加入`);
      }
    });
    prev.forEach((id) => {
      if (!next.has(id)) {
        lyricRef.value?.pushEvent(`观战玩家 ${id} 已离开`);
      }
    });
    prevSpectatorConnected.value = next;
  },
  { immediate: true }
);

function pushMockEvent(): void {
  lyricRef.value?.pushEvent(`事件 ${new Date().toLocaleTimeString()}：触发了一次本地模拟`);
}

async function leaveToLobby(): Promise<void> {
  const ok = await roomStore.leaveRoom();
  if (!ok) {
    return;
  }
  roomStore.backToLobby();
  await router.replace({ name: "lobby" });
}
</script>

<template>
  <section class="game-hud" v-if="roomStore.roomState">
    <header class="top-hud">
      <PlayerBar />
      <div class="ops">
        <span class="watching count">观战 {{ connectedSpectatorCount }}</span>
        <span v-if="roomStore.selfRole === 'spectator'" class="watching">观战中</span>
        <button class="btn ghost" type="button" @click="pushMockEvent">模拟事件</button>
        <button class="btn leave" type="button" @click="showExitConfirm = true">退出房间</button>
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
    <ConfirmModal
      :visible="showExitConfirm"
      title="退出房间"
      message="确定要退出房间吗？"
      confirm-text="确定退出"
      @cancel="showExitConfirm = false"
      @confirm="() => { showExitConfirm = false; leaveToLobby(); }"
    />
  </section>
</template>

<style scoped>
.game-hud {
  padding: 12px;
  display: grid;
  gap: 10px;
  height: 100dvh;
  box-sizing: border-box;
  overflow: hidden;
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
  align-items: center;
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
.watching {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #075985;
  background: #dbeafe;
}
.watching.count {
  color: #0f172a;
  background: #e0f2fe;
}
.hud-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 300px;
  gap: 10px;
  align-items: start;
  min-height: 0;
}
.center {
  min-width: 0;
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
