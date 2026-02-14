<script setup lang="ts">
import { debugState } from "./debugStore";
</script>

<template>
  <section v-if="debugState.enabled" class="debug-overlay">
    <p>stageRect: {{ debugState.stageWidth }} x {{ debugState.stageHeight }}</p>
    <p>boardScale: {{ debugState.boardScale.toFixed(3) }}</p>
    <p>tileCount: {{ debugState.tileCount }}</p>
    <p>rendered: {{ debugState.rendered }}</p>
    <p>hasNaN: {{ debugState.hasNaN }}</p>
    <p>tilesConfigLoaded: {{ debugState.tilesConfigLoaded }}</p>
    <p>usingFallback: {{ debugState.usingFallbackTiles }}</p>
    <p v-if="debugState.lastResource404Url">last404: {{ debugState.lastResource404Url }}</p>
    <p v-if="debugState.lastFetchError">fetchErr: {{ debugState.lastFetchError }}</p>
    <p v-if="debugState.lastLayoutError">layoutErr: {{ debugState.lastLayoutError }}</p>
    <p v-if="debugState.lastRuntimeError">runtimeErr: {{ debugState.lastRuntimeError }}</p>
  </section>
</template>

<style scoped>
.debug-overlay {
  position: fixed;
  left: 10px;
  top: 10px;
  z-index: 1200;
  width: min(92vw, 560px);
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #111827;
  font-size: 12px;
}
.debug-overlay p {
  margin: 0;
  line-height: 1.3;
  word-break: break-all;
}
</style>
