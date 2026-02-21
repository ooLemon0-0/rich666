<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { BOARD_CONFIG, BOARD_CORNER_INDEXES, BOARD_FIXED_TILE_SIZE_PX, BOARD_GRID_SIZE, BOARD_WORLD_SIZE_PX } from "../../game/board/boardConfig";

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
const routePointsForDraw = ref<RoutePoint[]>([]);
const roadPolyline = computed(() => {
  if (routePointsForDraw.value.length <= 1) {
    return "";
  }
  const ordered = routePointsForDraw.value.map((point) => `${point.x},${point.y}`);
  const first = routePointsForDraw.value[0];
  ordered.push(`${first.x},${first.y}`);
  return ordered.join(" ");
});
function computePoints(): void {
  if (props.tileCount <= 0) {
    routePointsForDraw.value = [];
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
    routePointsForDraw.value = [];
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
    const sideFor = (index: number): "top" | "right" | "bottom" | "left" => {
      if (index >= BOARD_CORNER_INDEXES[0] && index <= BOARD_CORNER_INDEXES[1]) {
        return "top";
      }
      if (index > BOARD_CORNER_INDEXES[1] && index <= BOARD_CORNER_INDEXES[2]) {
        return "right";
      }
      if (index > BOARD_CORNER_INDEXES[2] && index <= BOARD_CORNER_INDEXES[3]) {
        return "bottom";
      }
      return "left";
    };
    const angleFor = (side: "top" | "right" | "bottom" | "left"): number => {
      if (side === "top") {
        return 0;
      }
      if (side === "right") {
        return 90;
      }
      if (side === "bottom") {
        return 180;
      }
      return 270;
    };
    const points: RoutePoint[] = BOARD_CONFIG.tiles.slice(0, props.tileCount).map((tile, index) => {
      const side = sideFor(index);
      return {
        x: (tile.mapX / BOARD_GRID_SIZE) * BOARD_WORLD_SIZE_PX,
        y: (tile.mapY / BOARD_GRID_SIZE) * BOARD_WORLD_SIZE_PX,
        w: BOARD_FIXED_TILE_SIZE_PX,
        h: BOARD_FIXED_TILE_SIZE_PX,
        angle: angleFor(side),
        isCorner: BOARD_CORNER_INDEXES.includes(index),
        side
      };
    });
    const hasNaN = points.some(
      (item) =>
        Number.isNaN(item.x) ||
        Number.isNaN(item.y) ||
        Number.isNaN(item.w) ||
        Number.isNaN(item.h)
    );
    if (hasNaN) {
      routePointsForDraw.value = [];
      emit("pointsChange", []);
      emit("tileScaleChange", 1);
      emit("layoutStatusChange", {
        rendered: false,
        tileCount: props.tileCount,
        scale: 1,
        hasNaN: true,
        lastError: "layout contains NaN"
      });
      return;
    }
    routePointsForDraw.value = points;
    emit("tileScaleChange", 1);
    emit("pointsChange", points);
    emit("layoutStatusChange", {
      rendered: true,
      tileCount: points.length,
      scale: 1,
      hasNaN: false,
      lastError: ""
    });
  } catch (error) {
    routePointsForDraw.value = [];
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
        <stop offset="0%" stop-color="#fde68a" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
    </defs>
    <polyline
      v-if="roadPolyline"
      :points="roadPolyline"
      fill="none"
      stroke="url(#routeStroke)"
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.35"
    />
    <polyline
      v-if="roadPolyline"
      :points="roadPolyline"
      fill="none"
      stroke="#fff8dc"
      stroke-width="12"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.55"
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
