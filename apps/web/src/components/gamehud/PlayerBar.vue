<script setup lang="ts">
import defaultAvatar from "../../assets/default-avatar.svg";
import { getCharacterVisual } from "../../game/characters/characters";
import { useRoomStore } from "../../stores/roomStore";

const roomStore = useRoomStore();
</script>

<template>
  <section class="player-bar">
    <article
      v-for="player in roomStore.players.slice(0, 6)"
      :key="player.playerId"
      class="player-card"
      :class="{ self: player.playerId === roomStore.selfPlayerId }"
      :style="{ '--role-color': getCharacterVisual(player.selectedCharacterId).color }"
    >
      <img
        class="avatar"
        :src="getCharacterVisual(player.selectedCharacterId)?.avatarUrl ?? defaultAvatar"
        :alt="getCharacterVisual(player.selectedCharacterId).displayName"
      />
      <div class="meta">
        <p class="name">{{ getCharacterVisual(player.selectedCharacterId).displayName || "未选择角色" }}</p>
        <p class="cash">🪙 {{ player.cash }}</p>
      </div>
      <span v-if="player.playerId === roomStore.roomState?.hostPlayerId" class="host-tag">👑</span>
      <span class="ready-tag" :class="{ on: player.ready }">{{ player.ready ? "已准备" : "未准备" }}</span>
      <span v-if="player.playerId === roomStore.selfPlayerId" class="self-tag">你</span>
    </article>
  </section>
</template>

<style scoped>
.player-bar {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.player-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 2px solid color-mix(in srgb, var(--role-color, #93c5fd) 72%, #dbeafe);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--role-color, #93c5fd) 28%, transparent);
}
.player-card.self {
  border-color: color-mix(in srgb, var(--role-color, #60a5fa) 88%, #ffffff);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--role-color, #60a5fa) 30%, transparent),
    0 0 18px color-mix(in srgb, var(--role-color, #60a5fa) 34%, transparent);
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid rgba(30, 64, 175, 0.34);
}
.meta {
  min-width: 0;
}
.name,
.cash {
  margin: 0;
  line-height: 1.2;
}
.name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cash {
  font-size: 13px;
  color: #475569;
}
.self-tag {
  position: absolute;
  right: 6px;
  top: 6px;
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
}
.host-tag {
  position: absolute;
  left: 6px;
  top: 6px;
  font-size: 12px;
}
.ready-tag {
  position: absolute;
  right: 6px;
  bottom: 6px;
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 800;
  color: #92400e;
  background: #fef3c7;
}
.ready-tag.on {
  color: #065f46;
  background: #d1fae5;
}
@media (max-width: 1024px) {
  .player-bar {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .player-card {
    min-width: 200px;
  }
}
</style>
