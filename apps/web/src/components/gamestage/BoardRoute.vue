<script setup lang="ts">
import { nextTick, onMounted, watch } from "vue";
import { layoutRectBoard } from "../../game/layout/layoutRectBoard";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
}

const props = defineProps<{
  tileCount: number;
}>();

const emit = defineEmits<{
  pointsChange: [points: RoutePoint[]];
  tileScaleChange: [scale: number];
}>();

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 680;
const TILE_BASE_SIZE = 86;

function computePoints(): void {
  if (props.tileCount <= 0) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    return;
  }
  const result = layoutRectBoard({
    stageWidth: VIEW_WIDTH,
    stageHeight: VIEW_HEIGHT,
    tileCount: props.tileCount,
    tileWidth: TILE_BASE_SIZE,
    tileHeight: TILE_BASE_SIZE,
    margin: 58,
    safeScaleMultiplier: 1.1
  });
  emit("tileScaleChange", result.tileScale);
  emit(
    "pointsChange",
    result.points.map((item) => ({ xPct: item.xPct, yPct: item.yPct, angle: item.angle }))
  );
}

onMounted(async () => {
  await nextTick();
  computePoints();
});

watch(
  () => props.tileCount,
  async () => {
    await nextTick();
    computePoints();
  }
);
</script>

<template>
  <svg class="route-svg" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
    </defs>
    <rect
      x="58"
      y="58"
      width="884"
      height="564"
      rx="36"
      ry="36"
      fill="none"
      stroke="url(#routeStroke)"
      stroke-width="20"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.28"
    />
  </svg>
</template>

<style scoped>
.route-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
