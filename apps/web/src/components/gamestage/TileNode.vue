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
  runtimeLevel?: number;
  isCorner?: boolean;
  selected?: boolean;
  debugOverlap?: boolean;
  occupants: Array<{ playerId: string; avatarUrl: string; color: string }>;
}>();

const emit = defineEmits<{
  select: [tileIndex: number];
}>();

const ROTATE_OFFSET_DEG = 2;
const TOKEN_SIZE = 32;

const ownerColor = computed(() => getCharacterColor(props.ownerCharacterId));
const ownerVisual = computed(() => getCharacterVisual(props.ownerCharacterId));
const nameClass = computed(() => (props.tile.nameZh.length >= 4 ? "name long" : "name"));
const shownPrice = computed(() => props.runtimePrice ?? (props.tile.type === "property" ? props.tile.price : 0));
const shownRent = computed(() => props.runtimeRent ?? (props.tile.type === "property" ? props.tile.toll : 0));
const amountLabel = computed(() => (props.ownerCharacterId ? `🚧 ${shownRent.value}` : `💰 ${shownPrice.value}`));
const buildingLevel = computed(() => Math.max(0, Math.min(6, props.runtimeLevel ?? 0)));
const buildingMarkers = computed(() => {
  const level = buildingLevel.value;
  if (level <= 0) {
    return [];
  }
  if (level <= 4) {
    return Array.from({ length: level }, () => "house" as const);
  }
  return [...Array.from({ length: 4 }, () => "house" as const), "hotel" as const];
});
const zhouTheme = computed(() => {
  if (props.tile.type !== "property") {
    return { main: "#60a5fa", soft: "#dbeafe", text: "#1e3a8a" };
  }
  const palette: Record<string, { main: string; soft: string; text: string }> = {
    冀: { main: "#2563eb", soft: "#dbeafe", text: "#1e3a8a" },
    兖: { main: "#7c3aed", soft: "#ede9fe", text: "#4c1d95" },
    青: { main: "#0891b2", soft: "#cffafe", text: "#155e75" },
    徐: { main: "#059669", soft: "#d1fae5", text: "#065f46" },
    豫: { main: "#d97706", soft: "#fef3c7", text: "#92400e" },
    扬: { main: "#db2777", soft: "#fce7f3", text: "#9d174d" },
    荆: { main: "#65a30d", soft: "#ecfccb", text: "#365314" },
    梁: { main: "#ea580c", soft: "#ffedd5", text: "#9a3412" },
    雍: { main: "#4f46e5", soft: "#e0e7ff", text: "#3730a3" }
  };
  return palette[props.tile.zhouKey] ?? { main: "#60a5fa", soft: "#dbeafe", text: "#1e3a8a" };
});

function getTokenOffset(index: number, total: number): { x: number; y: number } {
  const unit = TOKEN_SIZE * 0.35;
  if (total <= 1) {
    return { x: 0, y: 0 };
  }
  if (total === 2) {
    return index === 0 ? { x: -unit, y: 0 } : { x: unit, y: 0 };
  }
  if (total === 3) {
    return [{ x: 0, y: -unit * 1.05 }, { x: -unit, y: unit * 0.8 }, { x: unit, y: unit * 0.8 }][index] ?? { x: 0, y: 0 };
  }
  if (total === 4) {
    return [{ x: -unit, y: -unit * 0.8 }, { x: unit, y: -unit * 0.8 }, { x: -unit, y: unit * 0.8 }, { x: unit, y: unit * 0.8 }][index] ?? { x: 0, y: 0 };
  }
  const radius = total === 5 ? TOKEN_SIZE * 0.42 : TOKEN_SIZE * 0.48;
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
      '--zhou-color': zhouTheme.main,
      '--zhou-soft': zhouTheme.soft,
      '--zhou-text': zhouTheme.text,
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
      <div v-if="tile.type === 'property' && ownerCharacterId && buildingMarkers.length > 0" class="upgrade-badges">
        <span
          v-for="(marker, idx) in buildingMarkers"
          :key="`${marker}-${idx}`"
          class="upgrade-badge"
          :class="marker"
          :title="`Lv.${buildingLevel}`"
        >
          {{ marker === "hotel" ? "🏨" : "🏠" }}
        </span>
      </div>
      <div class="tokens" :class="`count-${Math.min(occupants.length, 6)}`">
        <span
          v-for="(player, index) in occupants.slice(0, 6)"
          :key="player.playerId"
          class="token-wrap"
          :style="{
            left: `calc(50% + ${getTokenOffset(index, Math.min(occupants.length, 6)).x}px)`,
            top: `calc(62% + ${getTokenOffset(index, Math.min(occupants.length, 6)).y}px)`
          }"
        >
          <TokenAvatar :avatar-url="player.avatarUrl" :color="player.color" :size="TOKEN_SIZE" />
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.tile-node {
  --tile-name-fs: clamp(14px, 1.25vw, 17px);
  --tile-name-long-fs: clamp(12px, 1.08vw, 14px);
  --tile-corner-name-fs: clamp(15px, 1.35vw, 19px);
  --tile-corner-name-long-fs: clamp(13px, 1.15vw, 15px);
  --tile-amount-fs: 13px;
  --tile-zhou-fs: 12px;
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
  border-color: color-mix(in srgb, var(--zhou-color, #94a3b8) 42%, rgba(148, 163, 184, 0.72));
  background: color-mix(in srgb, var(--zhou-soft, #ffffff) 32%, rgba(255, 255, 255, 0.92));
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
  font-size: var(--tile-zhou-fs);
  font-weight: 800;
}
.zhou-badge {
  background: var(--zhou-soft, #dbeafe);
  border: 1px solid color-mix(in srgb, var(--zhou-color, #60a5fa) 55%, #fff);
  color: var(--zhou-text, #1d4ed8);
}
.special-icon {
  background: #ffedd5;
}
.name {
  margin-top: 14px;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  font-size: var(--tile-name-fs);
  font-weight: 700;
  color: #0f172a;
  line-height: 1.12;
  text-align: center;
  max-width: 92%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  letter-spacing: 0.2px;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65),
    0 1px 3px rgba(15, 23, 42, 0.16);
}
.name.long {
  font-size: var(--tile-name-long-fs);
}
.tile-node.corner .name {
  font-size: var(--tile-corner-name-fs);
}
.tile-node.corner .name.long {
  font-size: var(--tile-corner-name-long-fs);
}
.amount {
  margin-top: 4px;
  padding: 0;
  font-size: var(--tile-amount-fs);
  font-weight: 700;
  color: #7c2d12;
  background: transparent;
  white-space: nowrap;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7),
    0 1px 3px rgba(15, 23, 42, 0.16);
}
.amount.rent {
  color: #0e7490;
}
.upgrade-badges {
  position: absolute;
  right: 4px;
  top: 4px;
  display: inline-flex;
  gap: 2px;
  max-width: calc(100% - 22px);
  flex-wrap: wrap;
  justify-content: flex-end;
  z-index: 3;
}
.upgrade-badge {
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  font-size: 10px;
  line-height: 1;
  border-radius: 4px;
  border: 1px solid rgba(120, 53, 15, 0.35);
  background: rgba(255, 251, 235, 0.92);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
}
.upgrade-badge.hotel {
  border-color: rgba(120, 53, 15, 0.55);
  background: rgba(254, 243, 199, 0.95);
}
.tokens {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.token-wrap {
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
