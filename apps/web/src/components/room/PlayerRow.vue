<script setup lang="ts">
import { computed } from "vue";
import defaultAvatar from "../../assets/default-avatar.svg";
import { getCharacterById } from "../../data/characters";

const props = defineProps<{
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  characterId: string | null;
  isSelf: boolean;
  connected: boolean;
}>();

const emit = defineEmits<{
  modifyRole: [];
}>();

const characterName = computed(() => {
  if (!props.characterId) {
    return "未选择角色";
  }
  return getCharacterById(props.characterId)?.name ?? "未知角色";
});

const avatarUrl = computed(() => getCharacterById(props.characterId)?.avatarPath ?? defaultAvatar);
const modifyLabel = computed(() => (props.characterId ? "修改角色" : "选择角色"));
</script>

<template>
  <li class="player-row" :class="{ self: isSelf }">
    <img class="avatar" :src="avatarUrl" :alt="characterName" />
    <span v-if="isSelf" class="self-pin">你</span>
    <span class="name">{{ nickname }}</span>
    <span class="role">{{ characterName }}</span>
    <span class="state" :class="{ ready: isReady }">{{ isReady ? "已准备" : "未准备" }}</span>
    <span v-if="!connected" class="badge offline">离线</span>
    <span v-if="isHost" class="badge host">👑 房主</span>
    <button v-if="isSelf" class="modify-btn" type="button" @click="emit('modifyRole')">
      <span>🎭</span>
      <span>{{ modifyLabel }}</span>
    </button>
  </li>
</template>

<style scoped>
.player-row {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.84);
}

.player-row.self {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.28),
    inset 0 0 26px rgba(147, 197, 253, 0.28);
  background: radial-gradient(circle at left center, rgba(191, 219, 254, 0.45), rgba(255, 255, 255, 0.9));
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(30, 64, 175, 0.35);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  object-fit: cover;
}

.self-pin {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.name {
  font-weight: 800;
  color: #1e293b;
}

.role {
  color: #475569;
}

.state {
  margin-left: auto;
  color: #b45309;
  font-weight: 700;
}

.state.ready {
  color: #047857;
}

.badge {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
}

.badge.host {
  background: #ede9fe;
  color: #6d28d9;
}

.badge.me {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.offline {
  background: #e2e8f0;
  color: #475569;
}

.modify-btn {
  margin-left: 6px;
  border: 1px solid rgba(56, 189, 248, 0.6);
  border-radius: 999px;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(180deg, #ecfeff, #bae6fd);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    0 3px 8px rgba(2, 132, 199, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.modify-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    0 6px 12px rgba(2, 132, 199, 0.3);
}
</style>
