<script setup lang="ts">
import { computed } from "vue";
import { useDebugStore } from "./debugStore";

const debug = useDebugStore();
const visible = computed(() => new URLSearchParams(window.location.search).has("debug"));
</script>

<template>
  <aside v-if="visible" class="debug-overlay">
    <p>stageRect: {{ debug.stageRect.width }} x {{ debug.stageRect.height }}</p>
    <p>boardScale: {{ debug.boardScale.toFixed(3) }}</p>
    <p>tileCount: {{ debug.tileCount }}</p>
    <p>rendered: {{ debug.rendered }}</p>
    <p>hasNaN: {{ debug.hasNaN }}</p>
    <p>tilesConfigLoaded: {{ debug.tilesConfigLoaded }}</p>
    <p>usingFallback: {{ debug.usingFallbackTiles }}</p>
    <p>tilesToRender: {{ debug.tilesToRenderCount }}</p>
    <p v-if="debug.lastResource404Url" class="warn">404 resource: {{ debug.lastResource404Url }}</p>
    <p v-if="debug.lastFetchError" class="warn">fetch err: {{ debug.lastFetchError }}</p>
    <p v-if="debug.runtimeError" class="err">runtime: {{ debug.runtimeError }}</p>
  </aside>
</template>

<style scoped>
.debug-overlay {
  position: fixed;
  left: 10px;
  top: 10px;
  z-index: 9999;
  width: min(92vw, 560px);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(59, 130, 246, 0.32);
  font-size: 12px;
  color: #111827;
  pointer-events: none;
}
p {
  margin: 0;
  line-height: 1.35;
}
.warn {
  color: #92400e;
}
.err {
  color: #b91c1c;
}
</style>
