<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from "vue";
import { layoutRectBoardFit } from "../../game/layout/layoutRectBoardFit";

interface RoutePoint {
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  isCorner: boolean;
  side: "top" | "right" | "bottom" | "left";
}

const props = defineProps<{
  tileCount: number;
  stageWidth: number;
  stageHeight: number;
}>();

const emit = defineEmits<{
  pointsChange: [points: RoutePoint[]];
  tileScaleChange: [scale: number];
  layoutStatusChange: [
    payload: { rendered: boolean; tileCount: number; scale: number; hasNaN: boolean; lastError: string }
  ];
}>();

const viewWidth = computed(() => Math.max(1, Math.floor(props.stageWidth || 0)));
const viewHeight = computed(() => Math.max(1, Math.floor(props.stageHeight || 0)));
function computePoints(): void {
  if (props.tileCount <= 0) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    emit("layoutStatusChange", {
      rendered: false,
      tileCount: 0,
      scale: 1,
      hasNaN: false,
      lastError: ""
    });
    return;
  }
  if (viewWidth.value < 300 || viewHeight.value < 300) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    emit("layoutStatusChange", {
      rendered: false,
      tileCount: props.tileCount,
      scale: 1,
      hasNaN: false,
      lastError: "stage rect too small"
    });
    return;
  }
  try {
    const result = layoutRectBoardFit({
      stageWidth: viewWidth.value,
      stageHeight: viewHeight.value,
      tileCount: props.tileCount,
      cornerSize: 142,
      edgeSize: 104,
      margin: 42
    });
    const hasNaN = result.points.some(
      (item) =>
        Number.isNaN(item.x) ||
        Number.isNaN(item.y) ||
        Number.isNaN(item.w) ||
        Number.isNaN(item.h)
    );
    if (hasNaN) {
      emit("pointsChange", []);
      emit("tileScaleChange", 1);
      emit("layoutStatusChange", {
        rendered: false,
        tileCount: props.tileCount,
        scale: result.boardScale,
        hasNaN: true,
        lastError: "layout contains NaN"
      });
      return;
    }
    emit("tileScaleChange", result.boardScale);
    emit("pointsChange", result.points);
    emit("layoutStatusChange", {
      rendered: true,
      tileCount: result.points.length,
      scale: result.boardScale,
      hasNaN: false,
      lastError: ""
    });
  } catch (error) {
    emit("pointsChange", []);
    emit("tileScaleChange", 1);
    emit("layoutStatusChange", {
      rendered: false,
      tileCount: props.tileCount,
      scale: 1,
      hasNaN: true,
      lastError: error instanceof Error ? error.message : String(error)
    });
  }
}

onMounted(async () => {
  await nextTick();
  computePoints();
});

watch(
  () => [props.tileCount, viewWidth.value, viewHeight.value],
  async () => {
    await nextTick();
    computePoints();
  }
);
</script>

<template>
  <svg class="route-svg" :viewBox="`0 0 ${viewWidth} ${viewHeight}`" preserveAspectRatio="none">
    <defs>
      <linearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
    </defs>
    <rect
      x="4%"
      y="6%"
      width="92%"
      height="88%"
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
