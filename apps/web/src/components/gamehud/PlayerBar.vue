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
  padding: 10px 10px 9px;
  border-radius: 14px;
  border: 1px solid rgba(191, 219, 254, 0.8);
  background: rgba(255, 255, 255, 0.86);
}
.player-card.self {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.22),
    0 0 18px rgba(96, 165, 250, 0.24);
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid rgba(30, 64, 175, 0.3);
  box-shadow: 0 4px 10px rgba(30, 64, 175, 0.18);
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
  font-size: 15px;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .avatar {
    width: 46px;
    height: 46px;
  }
}
</style>
