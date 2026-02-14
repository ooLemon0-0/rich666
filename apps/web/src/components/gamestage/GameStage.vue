<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BoardRoute from "./BoardRoute.vue";
import DiceButton from "./DiceButton.vue";
import DiceOverlay from "./DiceOverlay.vue";
import TileNode from "./TileNode.vue";
import TileDetailModal from "./TileDetailModal.vue";
import { getCharacterVisual } from "../../game/characters/characters";
import { useRoomStore } from "../../stores/roomStore";
import { setRuntimeError, updateDebugLayout, updateDebugStageRect } from "../../debug/debugStore";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
  wPct: number;
  hPct: number;
  isCorner: boolean;
}

const roomStore = useRoomStore();
const stageRef = ref<HTMLElement | null>(null);
const routePoints = ref<RoutePoint[]>([]);
const selectedTileIndex = ref<number | null>(null);
const stageRect = ref({ width: 0, height: 0 });
const layoutStatus = ref({
  rendered: false,
  tileCount: 0,
  scale: 1,
  hasNaN: false,
  lastError: ""
});
const runtimeError = ref("");
const stageReady = computed(() => stageRect.value.width >= 300 && stageRect.value.height >= 300);
const tiles = computed(() => roomStore.resolvedBoardTiles);
const tilesRenderable = computed(() => stageReady.value && layoutStatus.value.rendered && routePoints.value.length === tiles.value.length);
let resizeObserver: ResizeObserver | null = null;
let resizeRaf = 0;
let errorHandler: ((event: ErrorEvent) => void) | null = null;

function onPointsChange(points: RoutePoint[]): void {
  routePoints.value = points;
}

function onTileScaleChange(_scale: number): void {
  // kept for compatibility with BoardRoute emit signature
}

function onLayoutStatusChange(payload: {
  rendered: boolean;
  tileCount: number;
  scale: number;
  hasNaN: boolean;
  lastError: string;
}): void {
  layoutStatus.value = payload;
}

const occupantMap = computed(() => {
  const map = new Map<number, Array<{ playerId: string; avatarUrl: string; color: string }>>();
  roomStore.players.forEach((player) => {
    if (player.status === "left") {
      return;
    }
    const pos = player.position % tiles.value.length;
    const list = map.get(pos) ?? [];
    const visual = getCharacterVisual(player.selectedCharacterId);
    list.push({
      playerId: player.playerId,
      avatarUrl: visual.avatarUrl,
      color: visual.color
    });
    map.set(pos, list);
  });
  return map;
});

const ownerCharacterByIndex = computed(() =>
  roomStore.roomState?.board.map((tile) => tile.ownerCharacterId ?? null) ?? Array.from({ length: tiles.value.length }, () => null)
);

const selectedPropertyTile = computed(() => {
  if (selectedTileIndex.value === null) {
    return null;
  }
  const tile = tiles.value[selectedTileIndex.value];
  return tile?.type === "property" ? tile : null;
});

const selectedBoardTileRuntime = computed(() => {
  if (selectedTileIndex.value === null || !roomStore.roomState) {
    return null;
  }
  return roomStore.roomState.board[selectedTileIndex.value] ?? null;
});

const selectedOwnerCharacterId = computed(() => selectedBoardTileRuntime.value?.ownerCharacterId ?? null);
const canBuySelectedTile = computed(
  () =>
    roomStore.canBuy &&
    selectedTileIndex.value !== null &&
    roomStore.currentTile?.index === selectedTileIndex.value &&
    !selectedBoardTileRuntime.value?.ownerPlayerId
);

async function handleRollClick(): Promise<void> {
  await roomStore.rollDice();
}

async function handleBuySelectedTile(): Promise<void> {
  const ok = await roomStore.buyCurrentTile();
  if (ok) {
    selectedTileIndex.value = null;
  }
}

function handleSelectTile(tileIndex: number): void {
  const tile = tiles.value[tileIndex];
  if (tile?.type !== "property") {
    return;
  }
  selectedTileIndex.value = tileIndex;
}

function closeTileModal(): void {
  selectedTileIndex.value = null;
}

function handleEscClose(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeTileModal();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleEscClose);
  if (stageRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      if (resizeRaf) {
        window.cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = window.requestAnimationFrame(() => {
        stageRect.value = {
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        };
        updateDebugStageRect(stageRect.value.width, stageRect.value.height);
      });
    });
    resizeObserver.observe(stageRef.value);
  }
  errorHandler = (event: ErrorEvent) => {
    runtimeError.value = event.message;
    setRuntimeError(event.message);
  };
  window.addEventListener("error", errorHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscClose);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (resizeRaf) {
    window.cancelAnimationFrame(resizeRaf);
    resizeRaf = 0;
  }
  if (errorHandler) {
    window.removeEventListener("error", errorHandler);
    errorHandler = null;
  }
});

watch(
  () => stageRect.value,
  (next) => {
    console.log("[STAGE]", next);
  },
  { deep: true }
);

watch(
  () => layoutStatus.value,
  (next) => {
    console.log("[LAYOUT]", next);
    updateDebugLayout({
      boardScale: next.scale,
      tileCount: next.tileCount,
      rendered: next.rendered,
      hasNaN: next.hasNaN,
      runtimeError: next.lastError
    });
  },
  { deep: true }
);
</script>

<template>
  <section ref="stageRef" class="game-stage">
    <BoardRoute
      :tile-count="tiles.length"
      :stage-width="stageRect.width"
      :stage-height="stageRect.height"
      @points-change="onPointsChange"
      @tile-scale-change="onTileScaleChange"
      @layout-status-change="onLayoutStatusChange"
    />

    <TileNode
      v-for="(tile, index) in tilesRenderable ? tiles : []"
      :key="tile.id"
      :tile-index="index"
      :tile="tile"
      :point="routePoints[index] ?? { xPct: 50, yPct: 50, angle: 0, wPct: 10, hPct: 10, isCorner: false }"
      :width-pct="routePoints[index]?.wPct ?? 10"
      :height-pct="routePoints[index]?.hPct ?? 10"
      :is-corner="routePoints[index]?.isCorner ?? false"
      :owner-character-id="ownerCharacterByIndex[index] ?? null"
      :runtime-price="roomStore.roomState?.board[index]?.price ?? null"
      :runtime-rent="roomStore.roomState?.board[index]?.rent ?? null"
      :selected="selectedTileIndex === index"
      :occupants="occupantMap.get(index) ?? []"
      @select="handleSelectTile"
    />

    <div class="dice-anchor">
      <DiceButton :disabled="!roomStore.canRoll" @roll="handleRollClick" />
    </div>
    <DiceOverlay :event="roomStore.diceRolledEvent" />
    <TileDetailModal
      :open="selectedTileIndex !== null"
      :tile="selectedPropertyTile"
      :owner-character-id="selectedOwnerCharacterId"
      :can-buy="canBuySelectedTile"
      :buying="roomStore.tradePending"
      @close="closeTileModal"
      @buy="handleBuySelectedTile"
    />
    <div v-if="!tilesRenderable" class="board-loading">Loading board...</div>
  </section>
</template>

<style scoped>
.game-stage {
  position: relative;
  width: 100%;
  height: min(72vh, 760px);
  min-height: 440px;
  max-height: 760px;
  border-radius: 18px;
  border: 2px solid rgba(186, 230, 253, 0.9);
  overflow: hidden;
  background: linear-gradient(170deg, #e0f2fe 0%, #bae6fd 55%, #93c5fd 100%);
}
.game-stage::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(56%, 520px);
  height: min(48%, 360px);
  transform: translate(-50%, -50%);
  border-radius: 28px;
  border: 2px solid rgba(255, 255, 255, 0.52);
  background:
    radial-gradient(circle at 26% 24%, rgba(255, 255, 255, 0.44), transparent 50%),
    linear-gradient(170deg, rgba(254, 249, 195, 0.44), rgba(254, 240, 138, 0.3));
  box-shadow: inset 0 0 0 1px rgba(217, 119, 6, 0.14);
  pointer-events: none;
  z-index: 0;
}
.game-stage > * {
  position: relative;
  z-index: 1;
}
.dice-anchor {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 30;
  pointer-events: auto;
}
.board-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 12px;
  border-radius: 10px;
  color: #0f172a;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.85);
  z-index: 12;
}
@media (max-height: 840px) {
  .game-stage {
    height: min(68vh, 680px);
    min-height: 400px;
  }
}
</style>
