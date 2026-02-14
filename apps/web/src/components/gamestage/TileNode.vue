<script setup lang="ts">
import type { BoardTileConfig } from "../../game/board/boardConfig";
import { computed } from "vue";
import { getCharacterVisual } from "../../game/characters/characters";
import { getCharacterColor } from "../../game/characters/characterPalette";
import TokenAvatar from "./TokenAvatar.vue";

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
  tileIndex: number;
  tile: BoardTileConfig;
  point: RoutePoint;
  ownerCharacterId: string | null;
  widthPx: number;
  heightPx: number;
  runtimePrice?: number | null;
  runtimeRent?: number | null;
  isCorner?: boolean;
  selected?: boolean;
  debugOverlap?: boolean;
  occupants: Array<{ playerId: string; avatarUrl: string; color: string }>;
}>();

const emit = defineEmits<{
  select: [tileIndex: number];
}>();

const ROTATE_OFFSET_DEG = 2;

const ownerColor = computed(() => getCharacterColor(props.ownerCharacterId));
const ownerVisual = computed(() => getCharacterVisual(props.ownerCharacterId));
const nameClass = computed(() => (props.tile.nameZh.length >= 4 ? "name long" : "name"));
const shownPrice = computed(() => props.runtimePrice ?? (props.tile.type === "property" ? props.tile.price : 0));
const shownRent = computed(() => props.runtimeRent ?? (props.tile.type === "property" ? props.tile.toll : 0));
const amountLabel = computed(() => (props.ownerCharacterId ? `🚧 ${shownRent.value}` : `💰 ${shownPrice.value}`));

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
    :class="[tile.type, { selected: props.selected, corner: props.isCorner, unowned: !ownerCharacterId, 'debug-overlap': props.debugOverlap }]"
    :style="{
      left: `${point.x}px`,
      top: `${point.y}px`,
      '--tile-w': `${props.widthPx}px`,
      '--tile-h': `${props.heightPx}px`,
      '--owner-color': ownerColor,
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
      <span v-if="tile.type === 'property'" class="zhou-badge">{{ tile.tagIcon }}</span>
      <span v-else class="special-icon">{{ tile.icon }}</span>
      <span :class="nameClass">{{ tile.nameZh }}</span>
      <span v-if="tile.type === 'property'" class="amount" :class="{ rent: !!ownerCharacterId }">{{ amountLabel }}</span>
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
  border: 2px solid color-mix(in srgb, var(--owner-color, #94a3b8) 70%, #94a3b8);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.92);
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + var(--extra-rotate)));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;
  cursor: pointer;
}
.tile-node.debug-overlap {
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}
.tile-node:hover {
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + 2deg)) scale(1.04);
}
.tile-node.selected {
  transform: translate(-50%, -50%) rotate(calc(var(--base-rotate) + 2deg)) scale(1.07);
  border-color: rgba(56, 189, 248, 0.95);
  box-shadow:
    0 12px 22px rgba(15, 23, 42, 0.28),
    0 0 0 2px rgba(186, 230, 253, 0.95);
}
.tile-node.property {
  background: color-mix(in srgb, var(--owner-color, #ffffff) 18%, rgba(255, 255, 255, 0.92));
}
.tile-node.property.unowned {
  border-color: rgba(148, 163, 184, 0.8);
  background: rgba(255, 255, 255, 0.93);
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
  padding: 8px;
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
.zhou-badge,
.special-icon {
  position: absolute;
  top: -2px;
  left: -2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}
.zhou-badge {
  background: #dbeafe;
  color: #1d4ed8;
}
.special-icon {
  background: #ffedd5;
}
.name {
  margin-top: 14px;
  font-family: var(--font-game-cartoon, "Comic Sans MS", "PingFang SC", "Microsoft YaHei", sans-serif);
  font-size: clamp(12px, 1.1vw, 14px);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.05;
  text-align: center;
  max-width: 88%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  -webkit-text-stroke: 0.9px rgba(255, 255, 255, 0.9);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7),
    0 2px 6px rgba(15, 23, 42, 0.22);
}
.name.long {
  font-size: clamp(11px, 1vw, 13px);
}
.tile-node.corner .name {
  font-size: clamp(13px, 1.2vw, 16px);
}
.tile-node.corner .name.long {
  font-size: clamp(12px, 1.05vw, 14px);
}
.amount {
  margin-top: 2px;
  padding: 0;
  font-size: 11px;
  font-weight: 800;
  color: #92400e;
  background: transparent;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.82),
    0 2px 6px rgba(15, 23, 42, 0.2);
}
.amount.rent {
  color: #155e75;
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
