<script setup lang="ts">
import PlayerRow from "./PlayerRow.vue";

interface PlayerItem {
  playerId: string;
  nickname: string;
  ready: boolean;
  selectedCharacterId: string | null;
  connected: boolean;
}

const props = defineProps<{
  players: PlayerItem[];
  selfPlayerId: string;
  hostPlayerId: string;
}>();

const emit = defineEmits<{
  modifyRole: [];
}>();
</script>

<template>
  <ul class="player-list">
    <PlayerRow
      v-for="item in props.players"
      :key="item.playerId"
      :nickname="item.nickname"
      :is-host="item.playerId === props.hostPlayerId"
      :is-ready="item.ready"
      :character-id="item.selectedCharacterId"
      :connected="item.connected"
      :is-self="item.playerId === props.selfPlayerId"
      @modify-role="emit('modifyRole')"
    />
  </ul>
</template>

<style scoped>
.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}
</style>
