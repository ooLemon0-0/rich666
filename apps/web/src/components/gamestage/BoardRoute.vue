<script setup lang="ts">
import { nextTick, onMounted, watch } from "vue";
import { layoutRectBoardFit } from "../../game/layout/layoutRectBoardFit";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
  wPct: number;
  hPct: number;
  isCorner: boolean;
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
function computePoints(): void {
  if (props.tileCount <= 0) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    return;
  }
  const result = layoutRectBoardFit({
    stageWidth: VIEW_WIDTH,
    stageHeight: VIEW_HEIGHT,
    tileCount: props.tileCount,
    cornerSize: 142,
    edgeSize: 104,
    margin: 42
  });
  emit("tileScaleChange", result.boardScale);
  emit("pointsChange", result.points);
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
      x="44"
      y="44"
      width="912"
      height="592"
      rx="40"
      ry="40"
      fill="none"
      stroke="url(#routeStroke)"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.24"
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
