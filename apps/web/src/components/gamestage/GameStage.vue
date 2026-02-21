<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BoardRoute from "./BoardRoute.vue";
import DiceButton from "./DiceButton.vue";
import DiceOverlay from "./DiceOverlay.vue";
import LandingActionModal from "./LandingActionModal.vue";
import TileNode from "./TileNode.vue";
import TileDetailModal from "../../game/ui/TileDetailModal.vue";
import { BOARD_RICH666_V1 } from "@rich/game-config";
import { getCharacterVisual } from "../../game/characters/characters";
import { BOARD_FIXED_TILE_SIZE_PX, BOARD_WORLD_SIZE_PX } from "../../game/board/boardConfig";
import { useRoomStore } from "../../stores/roomStore";
import { debugState, setLayoutDebug, setRuntimeError, setStageDebug } from "../../debug/debugStore";

interface RoutePoint {
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  isCorner: boolean;
  side: "top" | "right" | "bottom" | "left";
}

function buildFallbackRoutePoints(count: number, width: number, height: number): RoutePoint[] {
  if (count <= 0 || width <= 0 || height <= 0) {
    return [];
  }
  const points: RoutePoint[] = [];
  const left = width * 0.1;
  const right = width * 0.9;
  const top = height * 0.1;
  const bottom = height * 0.9;
  const edgeStepX = (right - left) / 9;
  const edgeStepY = (bottom - top) / 9;
  for (let i = 0; i < count; i += 1) {
    const side = Math.floor(i / 10);
    const slot = i % 10;
    const isCorner = slot === 0;
    const w = isCorner ? 92 : 74;
    const h = isCorner ? 92 : 74;
    if (side === 0) {
      points.push({ x: isCorner ? left : left + slot * edgeStepX, y: top, angle: 0, w, h, isCorner, side: "top" });
    } else if (side === 1) {
      points.push({ x: right, y: isCorner ? top : top + slot * edgeStepY, angle: 90, w, h, isCorner, side: "right" });
    } else if (side === 2) {
      points.push({ x: isCorner ? right : right - slot * edgeStepX, y: bottom, angle: 180, w, h, isCorner, side: "bottom" });
    } else {
      points.push({ x: left, y: isCorner ? bottom : bottom - slot * edgeStepY, angle: 270, w, h, isCorner, side: "left" });
    }
  }
  return points;
}

const roomStore = useRoomStore();
const stageRef = ref<HTMLElement | null>(null);
const routePoints = ref<RoutePoint[]>([]);
const selectedTileIndex = ref<number | null>(null);
const stageRect = ref({ width: 0, height: 0 });
const cameraOffset = ref({ x: 0, y: 0 });
const cameraScale = ref(1);
const cameraMode = ref<"follow" | "manual">("follow");
const cameraPanelCollapsed = ref(false);
const transientFocusPlayerId = ref<string | null>(null);
let transientFocusTimer: number | null = null;
const dragState = ref({
  active: false,
  pointerId: -1,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
  moved: false
});
const suppressTileClickUntil = ref(0);
const layoutStatus = ref({
  rendered: false,
  tileCount: 0,
  scale: 1,
  hasNaN: false,
  lastError: ""
});
const stageReady = computed(() => stageRect.value.width >= 300 && stageRect.value.height >= 300);
const worldRect = computed(() => ({
  width: BOARD_WORLD_SIZE_PX,
  height: BOARD_WORLD_SIZE_PX
}));
const minZoom = computed(() => {
  if (!stageReady.value || worldRect.value.width <= 0 || worldRect.value.height <= 0) {
    return 1;
  }
  const fit = Math.min(stageRect.value.width / worldRect.value.width, stageRect.value.height / worldRect.value.height);
  return Math.max(0.35, Math.min(1, Number(fit.toFixed(3))));
});
const maxZoom = 2.2;
const zoomPercent = computed(() => Math.round(cameraScale.value * 100));
const tiles = computed(() => roomStore.tilesToRender);
const hasValidLayout = computed(() => layoutStatus.value.rendered && routePoints.value.length === tiles.value.length);
const renderPoints = computed(() =>
  hasValidLayout.value
    ? routePoints.value
    : buildFallbackRoutePoints(tiles.value.length, worldRect.value.width, worldRect.value.height)
);
const tilesRenderable = computed(() => tiles.value.length > 0 && renderPoints.value.length === tiles.value.length);
const tilesInvalid = computed(() => debugState.enabled && tiles.value.length !== BOARD_RICH666_V1.totalTiles);
const overlapTileIndexes = ref<Set<number>>(new Set());
let resizeObserver: ResizeObserver | null = null;
let resizeRaf = 0;
let errorHandler: ((event: ErrorEvent) => void) | null = null;

function onPointsChange(points: RoutePoint[]): void {
  routePoints.value = points;
  if (debugState.enabled && points.length >= 4) {
    console.log("[TILES_PREVIEW]", points.slice(0, 4).map((item, idx) => ({ idx, ...item })));
  }
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
  setLayoutDebug(payload);
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

const selectedConfigTile = computed(() => {
  if (selectedTileIndex.value === null) {
    return null;
  }
  return BOARD_RICH666_V1.tiles[selectedTileIndex.value] ?? null;
});

const selectedBoardTileRuntime = computed(() => {
  if (selectedTileIndex.value === null || !roomStore.roomState) {
    return null;
  }
  return roomStore.roomState.board[selectedTileIndex.value] ?? null;
});

const selectedOwnerCharacterId = computed(() => selectedBoardTileRuntime.value?.ownerCharacterId ?? null);
const selectedHouseCount = computed(() => selectedBoardTileRuntime.value?.level ?? 0);
const hasModalOpen = computed(() => selectedTileIndex.value !== null || Boolean(roomStore.currentLanding));

async function handleRollClick(): Promise<void> {
  await roomStore.rollDice();
}

async function handleLandingConfirm(): Promise<void> {
  await roomStore.decideCurrentAction(true);
}

async function handleLandingCancel(): Promise<void> {
  await roomStore.decideCurrentAction(false);
}

function handleSelectTile(tileIndex: number): void {
  if (Date.now() < suppressTileClickUntil.value) {
    return;
  }
  selectedTileIndex.value = tileIndex;
}

function closeTileModal(): void {
  selectedTileIndex.value = null;
}

function clampCameraOffset(offset: { x: number; y: number }): { x: number; y: number } {
  const scaledW = worldRect.value.width * cameraScale.value;
  const scaledH = worldRect.value.height * cameraScale.value;
  const minX = Math.min(0, stageRect.value.width - scaledW);
  const minY = Math.min(0, stageRect.value.height - scaledH);
  return {
    x: Math.max(minX, Math.min(0, offset.x)),
    y: Math.max(minY, Math.min(0, offset.y))
  };
}

function updateCameraToTarget(tileIndex: number | null): void {
  if (tileIndex === null || !renderPoints.value[tileIndex]) {
    cameraOffset.value = clampCameraOffset({ x: 0, y: 0 });
    return;
  }
  const target = renderPoints.value[tileIndex];
  const targetX = Math.round(stageRect.value.width / 2 - target.x * cameraScale.value);
  const targetY = Math.round(stageRect.value.height / 2 - target.y * cameraScale.value);
  cameraOffset.value = clampCameraOffset({ x: targetX, y: targetY });
}

function applyZoom(nextZoom: number, anchor?: { x: number; y: number }): void {
  const prevZoom = cameraScale.value;
  const clamped = Math.max(minZoom.value, Math.min(maxZoom, nextZoom));
  if (Math.abs(prevZoom - clamped) < 0.0001) {
    return;
  }
  cameraScale.value = clamped;
  if (cameraMode.value === "follow") {
    const turnPlayer = roomStore.players.find((item) => item.playerId === roomStore.currentTurnPlayerId);
    updateCameraToTarget(turnPlayer ? turnPlayer.position % Math.max(1, renderPoints.value.length) : null);
    return;
  }
  if (!anchor) {
    cameraOffset.value = clampCameraOffset(cameraOffset.value);
    return;
  }
  const worldX = (anchor.x - cameraOffset.value.x) / prevZoom;
  const worldY = (anchor.y - cameraOffset.value.y) / prevZoom;
  const nextOffset = {
    x: Math.round(anchor.x - worldX * clamped),
    y: Math.round(anchor.y - worldY * clamped)
  };
  cameraOffset.value = clampCameraOffset(nextOffset);
}

function centerFullMap(): void {
  cameraMode.value = "manual";
  cameraScale.value = minZoom.value;
  const scaledW = worldRect.value.width * cameraScale.value;
  const scaledH = worldRect.value.height * cameraScale.value;
  const centered = {
    x: Math.round((stageRect.value.width - scaledW) / 2),
    y: Math.round((stageRect.value.height - scaledH) / 2)
  };
  cameraOffset.value = clampCameraOffset(centered);
}

function enableFollowCamera(): void {
  cameraMode.value = "follow";
  transientFocusPlayerId.value = null;
  if (transientFocusTimer) {
    window.clearTimeout(transientFocusTimer);
    transientFocusTimer = null;
  }
  const turnPlayer = roomStore.players.find((item) => item.playerId === roomStore.currentTurnPlayerId);
  updateCameraToTarget(turnPlayer ? turnPlayer.position % Math.max(1, renderPoints.value.length) : null);
}

function setManualCamera(): void {
  cameraMode.value = "manual";
}

function toggleCameraPanel(): void {
  cameraPanelCollapsed.value = !cameraPanelCollapsed.value;
}

function openCameraPanel(): void {
  cameraPanelCollapsed.value = false;
}

function onZoomSliderInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }
  const value = Number(target.value);
  applyZoom(value);
}

function onBoardWheel(event: WheelEvent): void {
  event.preventDefault();
  cameraMode.value = "manual";
  const next = cameraScale.value + (event.deltaY < 0 ? 0.08 : -0.08);
  applyZoom(next, { x: event.offsetX, y: event.offsetY });
}

function onBoardPointerDown(event: PointerEvent): void {
  if (cameraMode.value !== "manual" || hasModalOpen.value) {
    return;
  }
  if (event.button !== 0) {
    return;
  }
  dragState.value = {
    active: true,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startOffsetX: cameraOffset.value.x,
    startOffsetY: cameraOffset.value.y,
    moved: false
  };
}

function onBoardPointerMove(event: PointerEvent): void {
  if (!dragState.value.active || dragState.value.pointerId !== event.pointerId) {
    return;
  }
  const dx = event.clientX - dragState.value.startX;
  const dy = event.clientY - dragState.value.startY;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    dragState.value.moved = true;
    openCameraPanel();
  }
  const next = {
    x: Math.round(dragState.value.startOffsetX + dx),
    y: Math.round(dragState.value.startOffsetY + dy)
  };
  cameraOffset.value = clampCameraOffset(next);
}

function onBoardPointerUp(event: PointerEvent): void {
  if (!dragState.value.active || dragState.value.pointerId !== event.pointerId) {
    return;
  }
  if (dragState.value.moved) {
    suppressTileClickUntil.value = Date.now() + 180;
  }
  dragState.value.active = false;
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
        const next = {
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        };
        stageRect.value = next;
        setStageDebug(next.width, next.height);
      });
    });
    resizeObserver.observe(stageRef.value);
  }
  errorHandler = (event: ErrorEvent) => {
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
  if (transientFocusTimer) {
    window.clearTimeout(transientFocusTimer);
    transientFocusTimer = null;
  }
});

watch(
  () => stageRect.value,
  (next) => {
    if (debugState.enabled) {
      console.log("[STAGE]", next);
    }
  },
  { deep: true }
);

watch(
  () => layoutStatus.value,
  (next) => {
    if (debugState.enabled) {
      console.log("[LAYOUT]", next);
    }
  },
  { deep: true }
);

watch(
  () => renderPoints.value.map((point) => ({ x: point.x, y: point.y, w: point.w, h: point.h })),
  (boxes) => {
    const overlaps = new Set<number>();
    for (let i = 0; i < boxes.length; i += 1) {
      const a = boxes[i];
      const ax1 = a.x - a.w / 2;
      const ay1 = a.y - a.h / 2;
      const ax2 = a.x + a.w / 2;
      const ay2 = a.y + a.h / 2;
      for (let j = i + 1; j < boxes.length; j += 1) {
        const b = boxes[j];
        const bx1 = b.x - b.w / 2;
        const by1 = b.y - b.h / 2;
        const bx2 = b.x + b.w / 2;
        const by2 = b.y + b.h / 2;
        const hit = ax1 < bx2 - 2 && ax2 > bx1 + 2 && ay1 < by2 - 2 && ay2 > by1 + 2;
        if (hit) {
          overlaps.add(i);
          overlaps.add(j);
        }
      }
    }
    overlapTileIndexes.value = overlaps;
    if (overlaps.size > 0) {
      console.error("[TILE_OVERLAP]", Array.from(overlaps.values()));
    }
  },
  { deep: true }
);

watch(
  () => [roomStore.currentTurnPlayerId, roomStore.players.map((p) => `${p.playerId}:${p.position}`).join("|"), renderPoints.value.length, stageRect.value.width, stageRect.value.height],
  () => {
    if (cameraMode.value !== "follow") {
      cameraOffset.value = clampCameraOffset(cameraOffset.value);
      return;
    }
    const turnId = roomStore.currentTurnPlayerId;
    if (!turnId || renderPoints.value.length === 0) {
      updateCameraToTarget(null);
      return;
    }
    if (turnId === roomStore.playerId) {
      transientFocusPlayerId.value = null;
      if (transientFocusTimer) {
        window.clearTimeout(transientFocusTimer);
        transientFocusTimer = null;
      }
    }
    const focusId = transientFocusPlayerId.value ?? turnId;
    const focusPlayer = roomStore.players.find((item) => item.playerId === focusId);
    if (!focusPlayer) {
      updateCameraToTarget(null);
      return;
    }
    updateCameraToTarget(focusPlayer.position % renderPoints.value.length);
  },
  { immediate: true }
);

watch(
  () => roomStore.diceRolledEvent?.seq,
  () => {
    if (cameraMode.value !== "follow") {
      return;
    }
    const payload = roomStore.diceRolledEvent?.payload;
    if (!payload) {
      return;
    }
    if (payload.playerId === roomStore.playerId) {
      return;
    }
    transientFocusPlayerId.value = payload.playerId;
    if (transientFocusTimer) {
      window.clearTimeout(transientFocusTimer);
    }
    transientFocusTimer = window.setTimeout(() => {
      transientFocusPlayerId.value = null;
      transientFocusTimer = null;
    }, 2200);
  }
);

watch(
  () => [stageRect.value.width, stageRect.value.height, worldRect.value.width, worldRect.value.height, minZoom.value],
  () => {
    if (!stageReady.value) {
      return;
    }
    if (cameraScale.value < minZoom.value) {
      cameraScale.value = minZoom.value;
    }
    if (cameraMode.value === "follow") {
      const turnPlayer = roomStore.players.find((item) => item.playerId === roomStore.currentTurnPlayerId);
      updateCameraToTarget(turnPlayer ? turnPlayer.position % Math.max(1, renderPoints.value.length) : null);
    } else {
      cameraOffset.value = clampCameraOffset(cameraOffset.value);
    }
  },
  { immediate: true }
);
</script>

<template>
  <section ref="stageRef" class="game-stage" :class="{ debug: debugState.enabled }">
    <div
      class="board-layer"
      :class="{ manual: cameraMode === 'manual' }"
      @wheel.prevent="onBoardWheel"
      @pointerdown="onBoardPointerDown"
      @pointermove="onBoardPointerMove"
      @pointerup="onBoardPointerUp"
      @pointercancel="onBoardPointerUp"
      @pointerleave="onBoardPointerUp"
    >
      <div
        class="tiles-layer"
        :style="{
          width: `${worldRect.width}px`,
          height: `${worldRect.height}px`,
          transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${cameraScale})`
        }"
      >
        <BoardRoute
          :tile-count="tiles.length"
          :stage-width="worldRect.width"
          :stage-height="worldRect.height"
          @points-change="onPointsChange"
          @tile-scale-change="onTileScaleChange"
          @layout-status-change="onLayoutStatusChange"
        />
        <TileNode
          v-for="(tile, index) in tilesRenderable ? tiles : []"
          :key="tile.id"
          :tile-index="index"
          :tile="tile"
          :point="renderPoints[index] ?? { x: worldRect.width / 2, y: worldRect.height / 2, angle: 0, w: BOARD_FIXED_TILE_SIZE_PX, h: BOARD_FIXED_TILE_SIZE_PX, isCorner: false, side: 'top' }"
          :width-px="renderPoints[index]?.w ?? BOARD_FIXED_TILE_SIZE_PX"
          :height-px="renderPoints[index]?.h ?? BOARD_FIXED_TILE_SIZE_PX"
          :is-corner="renderPoints[index]?.isCorner ?? false"
          :owner-character-id="ownerCharacterByIndex[index] ?? null"
          :runtime-price="roomStore.roomState?.board[index]?.price ?? null"
          :runtime-rent="roomStore.roomState?.board[index]?.rent ?? null"
          :runtime-level="roomStore.roomState?.board[index]?.level ?? 0"
          :selected="selectedTileIndex === index"
          :debug-overlap="overlapTileIndexes.has(index)"
          :occupants="occupantMap.get(index) ?? []"
          @select="handleSelectTile"
        />
      </div>
    </div>

    <div class="overlay-layer">
      <button
        v-if="cameraPanelCollapsed"
        class="camera-fab"
        type="button"
        @click="openCameraPanel"
      >
        相机
      </button>
      <div v-else class="camera-controls">
        <div class="camera-head">
          <span>视角控制</span>
          <button class="collapse-btn" type="button" @click="toggleCameraPanel">—</button>
        </div>
        <button class="cam-btn" :class="{ active: cameraMode === 'follow' }" type="button" @click="enableFollowCamera">
          跟随当前
        </button>
        <button class="cam-btn" :class="{ active: cameraMode === 'manual' }" type="button" @click="setManualCamera">
          手动视角
        </button>
        <button class="cam-btn" type="button" @click="centerFullMap">全图</button>
        <div class="zoom-row">
          <span class="zoom-label">缩放</span>
          <input
            class="zoom-slider"
            type="range"
            :min="minZoom"
            :max="maxZoom"
            :step="0.01"
            :value="cameraScale"
            @input="onZoomSliderInput"
          />
          <span class="zoom-value">{{ zoomPercent }}%</span>
        </div>
      </div>
      <DiceOverlay :event="roomStore.diceRolledEvent" />
      <div class="dice-anchor">
        <DiceButton :disabled="!roomStore.canRoll" @roll="handleRollClick" />
      </div>
      <div class="modal-slot" :class="{ active: hasModalOpen }">
        <TileDetailModal
          :open="selectedTileIndex !== null"
          :tile="selectedConfigTile"
          :owner-character-id="selectedOwnerCharacterId"
          :build-level="selectedHouseCount"
          @close="closeTileModal"
        />
        <LandingActionModal
          :payload="roomStore.currentLanding"
          :expires-at="roomStore.currentActionMeta?.expiresAt ?? null"
          :pending="roomStore.tradePending"
          :is-self-turn="roomStore.currentTurnPlayerId === roomStore.playerId"
          @confirm="handleLandingConfirm"
          @cancel="handleLandingCancel"
          @close="roomStore.shiftLanding"
        />
      </div>
    </div>
    <div v-if="!tilesRenderable" class="board-loading">Loading board...</div>
    <div v-if="tilesInvalid" class="tiles-invalid">Tiles invalid: {{ tiles.length }}</div>
  </section>
</template>

<style scoped>
.game-stage {
  --token-size: 32px;
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
.game-stage.debug {
  outline: 2px dashed #ef4444;
}
.game-stage.debug :deep(.tile-node) {
  outline: 1px solid rgba(239, 68, 68, 0.7);
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
.board-layer {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
}
.board-layer.manual {
  cursor: grab;
}
.board-layer.manual:active {
  cursor: grabbing;
}
.tiles-layer {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  transform-origin: top left;
  transition: transform 220ms ease-out;
  will-change: transform;
}
.overlay-layer {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
}
.camera-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 38;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.34);
  background: rgba(240, 249, 255, 0.88);
  box-shadow: 0 8px 20px rgba(14, 116, 144, 0.18);
  pointer-events: auto;
}
.camera-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #155e75;
  font-weight: 800;
}
.collapse-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(14, 116, 144, 0.35);
  border-radius: 8px;
  background: #e0f2fe;
  color: #155e75;
  font-weight: 800;
  cursor: pointer;
}
.camera-fab {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 38;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(2, 132, 199, 0.6);
  border-radius: 999px;
  background: linear-gradient(180deg, #0ea5e9, #0284c7);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
  box-shadow: 0 8px 18px rgba(2, 132, 199, 0.32);
  pointer-events: auto;
  cursor: pointer;
}
.cam-btn {
  height: 30px;
  border: 1px solid rgba(2, 132, 199, 0.45);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  background: linear-gradient(180deg, #ecfeff, #bae6fd);
  cursor: pointer;
}
.cam-btn.active {
  color: #fff;
  border-color: rgba(2, 132, 199, 0.75);
  background: linear-gradient(180deg, #0ea5e9, #0284c7);
}
.zoom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zoom-label {
  min-width: 30px;
  font-size: 12px;
  color: #155e75;
  font-weight: 700;
}
.zoom-slider {
  flex: 1;
}
.zoom-value {
  min-width: 40px;
  font-size: 12px;
  color: #0f172a;
  text-align: right;
  font-weight: 800;
}
.dice-anchor {
  position: absolute;
  left: 12px;
  bottom: 12px;
  transform: none;
  z-index: 35;
  pointer-events: auto;
}
.modal-slot {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.modal-slot.active {
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
.tiles-invalid {
  position: absolute;
  left: 50%;
  top: 56%;
  transform: translateX(-50%);
  color: #b91c1c;
  font-weight: 800;
  z-index: 12;
}
@media (max-height: 840px) {
  .game-stage {
    height: min(68vh, 680px);
    min-height: 400px;
  }
}
</style>
