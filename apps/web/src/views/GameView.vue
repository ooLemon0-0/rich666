<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import EventLyric from "../components/gamehud/EventLyric.vue";
import GameStage from "../components/gamestage/GameStage.vue";
import ItemDock from "../components/gamehud/ItemDock.vue";
import PlayerBar from "../components/gamehud/PlayerBar.vue";
import TradePanel from "../components/gamehud/TradePanel.vue";
import ConfirmModal from "../components/ui/ConfirmModal.vue";
import { useRoomStore } from "../stores/roomStore";
import { playSfx, startBgm, stopBgm } from "../utils/sfx";

const router = useRouter();
const roomStore = useRoomStore();
const lyricRef = ref<InstanceType<typeof EventLyric> | null>(null);
const showExitConfirm = ref(false);
const prevSpectatorConnected = ref(new Set<string>());
const connectedSpectatorCount = computed(
  () => roomStore.roomState?.spectators?.filter((item) => item.connected).length ?? 0
);
const itemAnnouncement = computed(() => roomStore.itemAnnouncement);
const winnerPlayer = computed(
  () => roomStore.roomState?.players.find((item) => item.status === "active") ?? null
);
const showVictory = computed(() => roomStore.roomStatus === "ended" && Boolean(winnerPlayer.value));
const bgmOn = ref(true);
let clickHandler: ((event: MouseEvent) => void) | null = null;

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
    if (/获得|加|奖励|\+/.test(latest.text)) {
      playSfx("money_gain");
    } else if (/失去|支付|扣|破产|-/.test(latest.text)) {
      playSfx("money_lose");
    } else {
      playSfx("event_trigger");
    }
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

function toggleBgm(): void {
  bgmOn.value = !bgmOn.value;
  if (bgmOn.value) {
    startBgm();
  } else {
    stopBgm();
  }
}

onMounted(() => {
  if (bgmOn.value) {
    startBgm();
  }
  clickHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (target.closest("button")) {
      playSfx("ui_click");
      if (bgmOn.value) {
        startBgm();
      }
    }
  };
  window.addEventListener("click", clickHandler, true);
});

onBeforeUnmount(() => {
  if (clickHandler) {
    window.removeEventListener("click", clickHandler, true);
    clickHandler = null;
  }
  stopBgm();
});

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
        <button class="btn ghost" type="button" @click="toggleBgm">{{ bgmOn ? "音乐:开" : "音乐:关" }}</button>
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
    <div v-if="itemAnnouncement" class="item-ann-mask" @click.self="roomStore.clearItemAnnouncement()">
      <section class="item-ann-modal">
        <h3>{{ itemAnnouncement.title }}</h3>
        <p>{{ itemAnnouncement.text }}</p>
        <button type="button" class="btn ghost" @click="roomStore.clearItemAnnouncement()">知道了</button>
      </section>
    </div>
    <div v-if="showVictory" class="victory-mask">
      <section class="victory-modal">
        <div class="spark">🏆</div>
        <h2>胜利！</h2>
        <p>{{ winnerPlayer?.nickname || "玩家" }} 成为最后幸存者</p>
      </section>
    </div>
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
.item-ann-mask {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.45);
}
.item-ann-modal {
  width: min(92vw, 460px);
  border-radius: 14px;
  border: 2px solid rgba(250, 204, 21, 0.85);
  background: linear-gradient(180deg, #fff7ed, #fef3c7);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.3);
  padding: 14px;
}
.item-ann-modal h3 {
  margin: 0 0 6px;
  color: #92400e;
}
.item-ann-modal p {
  margin: 0 0 10px;
  color: #7c2d12;
  line-height: 1.5;
}
.victory-mask {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(15, 23, 42, 0.42), rgba(15, 23, 42, 0.72));
}
.victory-modal {
  width: min(90vw, 460px);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
  border: 2px solid rgba(250, 204, 21, 0.95);
  background: linear-gradient(180deg, #fef3c7, #fde68a);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.4);
  animation: victory-pop 500ms ease-out;
}
.victory-modal h2 {
  margin: 8px 0 6px;
  color: #92400e;
}
.victory-modal p {
  margin: 0;
  color: #7c2d12;
  font-weight: 700;
}
.spark {
  font-size: 42px;
  animation: victory-bounce 1.2s ease-in-out infinite;
}
@keyframes victory-pop {
  from { transform: scale(0.86); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes victory-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
