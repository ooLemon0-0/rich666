<script setup lang="ts">
import { useRoomStore } from "./stores/room";
import HomeView from "./views/HomeView.vue";
import RoomView from "./views/RoomView.vue";
import { GAME_CONFIG } from "./config/game";

const roomStore = useRoomStore();
</script>

<template>
  <main class="page">
    <h1>{{ GAME_CONFIG.title }}</h1>
    <HomeView v-if="!roomStore.inRoom" />
    <RoomView v-else />
  </main>
</template>
