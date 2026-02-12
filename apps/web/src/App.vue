<script setup lang="ts">
import { useRoomStore } from "./stores/room";
import HomeView from "./views/HomeView.vue";
import RoomView from "./views/RoomView.vue";

const roomStore = useRoomStore();
</script>

<template>
  <main class="page">
    <h1>联机大富翁</h1>
    <HomeView v-if="!roomStore.inRoom" />
    <RoomView v-else />
  </main>
</template>
