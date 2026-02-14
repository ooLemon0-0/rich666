<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BoardRoute from "./BoardRoute.vue";
import BoardCenterDecor from "./BoardCenterDecor.vue";
import DiceButton from "./DiceButton.vue";
import DiceOverlay from "./DiceOverlay.vue";
import TileNode from "./TileNode.vue";
import TileDetailModal from "./TileDetailModal.vue";
import { BOARD_TILES } from "../../game/board/boardConfig";
import { getCharacterVisual } from "../../game/characters/characters";
import { useRoomStore } from "../../stores/roomStore";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
  width: number;
  height: number;
  isCorner: boolean;
}

const roomStore = useRoomStore();
const routePoints = ref<RoutePoint[]>([]);
const tileScale = ref(1);
const selectedTileIndex = ref<number | null>(null);

const tiles = BOARD_TILES;

function onPointsChange(points: RoutePoint[]): void {
  routePoints.value = points;
}

function onTileScaleChange(scale: number): void {
  tileScale.value = scale;
}

const occupantMap = computed(() => {
  const map = new Map<number, Array<{ playerId: string; avatarUrl: string; color: string }>>();
  roomStore.players.forEach((player) => {
    const pos = player.position % tiles.length;
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
  roomStore.roomState?.board.map((tile) => tile.ownerCharacterId ?? null) ?? Array.from({ length: tiles.length }, () => null)
);

const selectedPropertyTile = computed(() => {
  if (selectedTileIndex.value === null) {
    return null;
  }
  const tile = tiles[selectedTileIndex.value];
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
  const tile = tiles[tileIndex];
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
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscClose);
});
</script>

<template>
  <section class="game-stage">
    <BoardRoute :tile-count="tiles.length" @points-change="onPointsChange" @tile-scale-change="onTileScaleChange" />
    <BoardCenterDecor />

    <TileNode
      v-for="(tile, index) in tiles"
      :key="tile.id"
      :tile-index="index"
      :tile="tile"
      :point="routePoints[index] ?? { xPct: 50, yPct: 50, angle: 0, width: 104, height: 104, isCorner: false }"
      :scale="tileScale"
      :owner-character-id="ownerCharacterByIndex[index] ?? null"
      :selected="selectedTileIndex === index"
      :occupants="occupantMap.get(index) ?? []"
      @select="handleSelectTile"
    />

    <DiceButton :disabled="!roomStore.canRoll" @roll="handleRollClick" />
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
  </section>
</template>

<style scoped>
.game-stage {
  position: relative;
  min-height: 760px;
  border-radius: 18px;
  border: 2px solid rgba(186, 230, 253, 0.9);
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 24%, rgba(255, 255, 255, 0.42), transparent 44%),
    radial-gradient(circle at 78% 76%, rgba(219, 234, 254, 0.34), transparent 46%),
    linear-gradient(165deg, #dbeafe 0%, #bfdbfe 45%, #93c5fd 100%);
}
</style>
