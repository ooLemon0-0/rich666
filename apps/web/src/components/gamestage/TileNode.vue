<script setup lang="ts">
import type { BoardTileConfig } from "../../game/board/boardConfig";
import { computed } from "vue";
import { getCharacterVisual } from "../../game/characters/characters";
import { getCharacterColor } from "../../game/characters/characterPalette";
import TokenAvatar from "./TokenAvatar.vue";

interface RoutePoint {
  xPct: number;
  yPct: number;
  angle: number;
}

const props = defineProps<{
  tileIndex: number;
  tile: BoardTileConfig;
  point: RoutePoint;
  ownerCharacterId: string | null;
  scale?: number;
  selected?: boolean;
  occupants: Array<{ playerId: string; avatarUrl: string; color: string }>;
}>();

const emit = defineEmits<{
  select: [tileIndex: number];
}>();

const TILE_WIDTH = 86;
const TILE_HEIGHT = 86;
const ROTATE_OFFSET_DEG = 2;

const ownerColor = computed(() => getCharacterColor(props.ownerCharacterId));
const ownerVisual = computed(() => getCharacterVisual(props.ownerCharacterId));
const nameClass = computed(() => (props.tile.nameZh.length >= 4 ? "name long" : "name"));

function getTokenOffset(index: number, total: number): { x: number; y: number } {
  if (total <= 1) {
    return { x: 0, y: 0 };
  }
  if (total === 2) {
    return index === 0 ? { x: -10, y: 0 } : { x: 10, y: 0 };
  }
  if (total === 3) {
    return [{ x: 0, y: -9 }, { x: -10, y: 8 }, { x: 10, y: 8 }][index] ?? { x: 0, y: 0 };
  }
  if (total === 4) {
    return [{ x: -10, y: -8 }, { x: 10, y: -8 }, { x: -10, y: 8 }, { x: 10, y: 8 }][index] ?? { x: 0, y: 0 };
  }
  const radius = total === 5 ? 12 : 14;
  const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius)
  };
}

function handleClick(): void {
  emit("select", props.tileIndex);
}
</script>

<template>
  <article
    class="tile-node"
    :class="[tile.type, { selected: props.selected }]"
    :style="{
      left: `${point.xPct}%`,
      top: `${point.yPct}%`,
      '--tile-w': `${TILE_WIDTH}px`,
      '--tile-h': `${TILE_HEIGHT}px`,
      '--tile-scale': props.scale ?? 1,
      '--base-rotate': `${point.angle}deg`,
      '--extra-rotate': props.selected ? `${ROTATE_OFFSET_DEG}deg` : '0deg'
    }"
    @click="handleClick"
  >
    <div
      v-if="tile.type === 'property' && ownerCharacterId"
      class="owner-tint"
      :style="{ '--owner-color': ownerColor }"
    >
      <span class="owner-badge">
        <img :src="ownerVisual.avatarUrl" :alt="ownerVisual.name" />
      </span>
    </div>
    <div class="inner" :style="{ transform: `rotate(${-point.angle}deg)` }">
      <span v-if="tile.type === 'property'" class="zhou">{{ tile.tagIcon }}</span>
      <span v-else class="special-icon">{{ tile.icon }}</span>
      <span :class="nameClass">{{ tile.nameZh }}</span>
      <div class="tokens" :class="`count-${Math.min(occupants.length, 6)}`">
        <span
          v-for="(player, index) in occupants.slice(0, 6)"
          :key="player.playerId"
          class="token-wrap"
          :style="{
            left: `calc(50% + ${getTokenOffset(index, Math.min(occupants.length, 6)).x}px)`,
            top: `calc(50% + ${getTokenOffset(index, Math.min(occupants.length, 6)).y}px)`
          }"
        >
          <TokenAvatar :avatar-url="player.avatarUrl" :color="player.color" :size="20" />
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.tile-node {
  position: absolute;
  width: var(--tile-w);
  height: var(--tile-h);
  border-radius: 14px;
  border: 2px solid rgba(148, 163, 184, 0.8);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.92);
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + var(--extra-rotate))) scale(var(--tile-scale));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;
  cursor: pointer;
}
.tile-node:hover {
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + 2deg)) scale(calc(var(--tile-scale) * 1.06));
}
.tile-node.selected {
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + 2deg)) scale(calc(var(--tile-scale) * 1.1));
  border-color: rgba(56, 189, 248, 0.95);
  box-shadow:
    0 12px 22px rgba(15, 23, 42, 0.28),
    0 0 0 2px rgba(186, 230, 253, 0.95);
}
.tile-node.property {
  border-color: rgba(59, 130, 246, 0.65);
}
.tile-node.special {
  border-color: rgba(251, 146, 60, 0.75);
  background: rgba(255, 251, 235, 0.95);
}
.inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 12px;
  padding: 6px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  place-items: center;
}
.owner-tint {
  position: absolute;
  inset: auto 0 0 0;
  height: 26%;
  background: color-mix(in srgb, var(--owner-color) 45%, transparent);
  z-index: 0;
}
.owner-tint::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 10px;
  border-radius: 50% 50% 0 0;
  background: color-mix(in srgb, var(--owner-color) 58%, transparent);
}
.owner-badge {
  position: absolute;
  right: 3px;
  top: -10px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid #fff;
  overflow: hidden;
  background: #fff;
}
.owner-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.zhou,
.special-icon {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}
.zhou {
  background: #dbeafe;
  color: #1d4ed8;
}
.special-icon {
  background: #ffedd5;
}
.name {
  margin-top: 12px;
  font-family: var(--font-game-cartoon, "Comic Sans MS", "PingFang SC", "Microsoft YaHei", sans-serif);
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.05;
  text-align: center;
  max-width: 70px;
  text-wrap: balance;
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.85);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7),
    0 2px 6px rgba(15, 23, 42, 0.22);
}
.name.long {
  font-size: 13px;
}
.tokens {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.token-wrap {
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
