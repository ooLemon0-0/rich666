<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoomStore } from "../stores/room";
import LobbyHeader from "../components/lobby/LobbyHeader.vue";
import LobbyLayout from "../components/lobby/LobbyLayout.vue";
import LobbyTabs from "../components/lobby/LobbyTabs.vue";
import PlayerIdentityCard from "../components/lobby/PlayerIdentityCard.vue";
import JoinRoomPanel from "../components/lobby/JoinRoomPanel.vue";
import { GAME_CONFIG } from "../config/game";

const roomStore = useRoomStore();
const activeTab = ref<"create" | "join">("create");
const nickname = ref("关云长");
const avatar = ref("🐲");
const faction = ref<"wei" | "shu" | "wu">("shu");
const roomId = ref("");
const localHint = ref("");
const RECENT_ROOMS_KEY = `rich:recent-rooms:${GAME_CONFIG.slug}`;

const recentRooms = ref<string[]>(readRecentRooms());

watch(
  () => roomStore.roomId,
  (value) => {
    if (value) {
      saveRecentRoom(value);
      localHint.value = `已进入房间 ${value}`;
    }
  }
);

const joinAlertType = computed<"info" | "error" | "success">(() => {
  if (roomStore.error) {
    return "error";
  }
  if (roomStore.pending) {
    return "info";
  }
  if (localHint.value) {
    return "success";
  }
  return "info";
});

const joinAlertMessage = computed(() => {
  if (roomStore.error) {
    return roomStore.error;
  }
  if (roomStore.pending) {
    return "正在与服务器同步战局...";
  }
  if (localHint.value) {
    return localHint.value;
  }
  return "输入 6 位邀请码，或从最近房间继续。";
});

async function handleCreateRoom() {
  localHint.value = "";
  await roomStore.createRoom(nickname.value);
}

async function handleJoinRoom() {
  localHint.value = "";
  await roomStore.joinRoom(roomId.value, nickname.value);
  if (!roomStore.error && roomId.value.trim()) {
    saveRecentRoom(roomId.value.trim().toUpperCase());
  }
}

function useRecentRoom(targetRoomId: string) {
  roomId.value = targetRoomId;
}

function readRecentRooms(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_ROOMS_KEY);
    if (!raw) {
      return [];
    }
    const list = JSON.parse(raw) as string[];
    return list.filter(Boolean).slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecentRoom(code: string): void {
  const normalized = code.trim().toUpperCase().slice(0, 6);
  if (!normalized) {
    return;
  }
  const list = [normalized, ...recentRooms.value.filter((item) => item !== normalized)].slice(0, 5);
  recentRooms.value = list;
  localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(list));
}
</script>

<template>
  <LobbyLayout>
    <template #header>
      <LobbyHeader :status="roomStore.connectionStatus" />
    </template>

    <template #left>
      <section class="lore-card">
        <h2>群英入局</h2>
        <p>
          选择你的名号、头像与阵营，在群雄割据的棋盘中运筹帷幄。每一步都可能左右天下财势，招募盟友并建立你的城池版图。
        </p>
        <ul>
          <li>🎲 服务端裁定掷骰与交易，公平对战</li>
          <li>🏯 三国阵营主题，Q版卡通大厅体验</li>
          <li>⚔️ 支持断线重连，继续你的征途</li>
        </ul>
        <div class="ornaments">
          <span>🏳️</span>
          <span>🪙</span>
          <span>🎴</span>
          <span>🎲</span>
        </div>
      </section>
    </template>

    <template #right>
      <section class="action-card" :class="`faction-${faction}`">
        <LobbyTabs v-model="activeTab" />
        <PlayerIdentityCard
          :nickname="nickname"
          :avatar="avatar"
          :faction="faction"
          @update:nickname="nickname = $event"
          @update:avatar="avatar = $event"
          @update:faction="faction = $event"
        />

        <div v-if="activeTab === 'create'" class="create-panel">
          <p class="create-title">创建战局</p>
          <p class="hint">当前头像：{{ avatar }} · 阵营：{{ faction.toUpperCase() }}</p>
          <button class="primary-btn" :disabled="roomStore.pending" @click="handleCreateRoom">
            {{ roomStore.pending ? "创建中..." : "立即创建" }}
          </button>
        </div>

        <JoinRoomPanel
          v-else
          v-model="roomId"
          :pending="roomStore.pending"
          :recent-rooms="recentRooms"
          :alert-message="joinAlertMessage"
          :alert-type="joinAlertType"
          @submit="handleJoinRoom"
          @use-recent="useRecentRoom"
        />
      </section>
    </template>
  </LobbyLayout>
</template>

<style scoped>
.lore-card {
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 22px rgba(124, 45, 18, 0.09);
}

.lore-card h2 {
  margin: 0 0 10px;
  color: #7c2d12;
}

.lore-card p {
  margin: 0 0 10px;
  color: #6b4f35;
  line-height: 1.6;
}

.lore-card ul {
  margin: 0;
  padding-left: 18px;
  color: #7c6f64;
}

.lore-card li {
  margin-bottom: 6px;
}

.ornaments {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  font-size: 22px;
}

.action-card {
  border-radius: 18px;
  padding: 16px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 26px rgba(124, 45, 18, 0.09);
}

.action-card.faction-wei {
  background: linear-gradient(165deg, rgba(239, 246, 255, 0.86), rgba(255, 255, 255, 0.76));
}

.action-card.faction-shu {
  background: linear-gradient(165deg, rgba(240, 253, 244, 0.86), rgba(255, 255, 255, 0.76));
}

.action-card.faction-wu {
  background: linear-gradient(165deg, rgba(255, 247, 237, 0.86), rgba(255, 255, 255, 0.76));
}

.create-panel {
  margin-top: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.73);
  border: 1px solid rgba(225, 198, 154, 0.65);
  padding: 14px;
}

.create-title {
  margin: 0 0 6px;
  font-weight: 700;
  color: #7c2d12;
}

.hint {
  margin: 0 0 12px;
  color: #7c6f64;
  font-size: 13px;
}

.primary-btn {
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(90deg, #f97316, #f59e0b);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
