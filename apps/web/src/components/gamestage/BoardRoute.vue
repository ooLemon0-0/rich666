<script setup lang="ts">
import { nextTick, onMounted, watch } from "vue";
import { layoutRectBoardV2 } from "../../game/layout/layoutRectBoardV2";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
  width: number;
  height: number;
  isCorner: boolean;
}

const props = defineProps<{
  tileCount: number;
}>();

const emit = defineEmits<{
  pointsChange: [points: RoutePoint[]];
  tileScaleChange: [scale: number];
}>();

const VIEW_WIDTH = 1160;
const VIEW_HEIGHT = 820;
const EDGE_TILE_SIZE = 104;
const CORNER_TILE_SIZE = 142;

function computePoints(): void {
  if (props.tileCount <= 0) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    return;
  }
  const result = layoutRectBoardV2({
    stageWidth: VIEW_WIDTH,
    stageHeight: VIEW_HEIGHT,
    tileCount: props.tileCount,
    edgeSize: EDGE_TILE_SIZE,
    cornerSize: CORNER_TILE_SIZE,
    margin: 46,
    safeScaleMultiplier: 1.1
  });
  emit("tileScaleChange", result.tileScale);
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
  <svg class="route-svg" viewBox="0 0 1160 820" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <linearGradient id="innerBoard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
        <stop offset="100%" stop-color="rgba(186,230,253,0.18)" />
      </linearGradient>
    </defs>
    <rect
      x="46"
      y="46"
      width="1068"
      height="728"
      rx="42"
      ry="42"
      fill="none"
      stroke="url(#routeStroke)"
      stroke-width="22"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.26"
    />
    <rect
      x="196"
      y="196"
      width="768"
      height="428"
      rx="34"
      ry="34"
      fill="url(#innerBoard)"
      stroke="rgba(148,163,184,0.35)"
      stroke-width="2"
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
