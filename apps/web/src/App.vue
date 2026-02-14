<script setup lang="ts">
import DebugOverlay from "./debug/DebugOverlay.vue";
</script>

<template>
  <main class="app-shell">
    <RouterView />
    <DebugOverlay />
  </main>
</template>
