<script setup lang="ts">
import { computed } from "vue";
import type { BoardTile } from "@rich/game-config";
import { getCharacterVisual } from "../../game/characters/characters";
import { getCharacterColor } from "../../game/characters/characterPalette";

const props = defineProps<{
  open: boolean;
  tile: BoardTile | null;
  ownerCharacterId: string | null;
  buildLevel: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

const ownerVisual = computed(() => getCharacterVisual(props.ownerCharacterId));
const ownerColor = computed(() => getCharacterColor(props.ownerCharacterId));
const levelLabels = ["未建房", "1屋", "2屋", "3屋"];
const rentRows = computed(() => {
  if (!props.tile || props.tile.type !== "property") {
    return [];
  }
  const rows = props.tile.rentByLevel ?? [props.tile.rent ?? 0];
  return rows.map((rent, level) => ({
    level,
    rent,
    label: levelLabels[level] ?? `${level}级`
  }));
});
</script>

<template>
  <Transition name="tile-detail-fade">
    <div v-if="open && tile" class="overlay" @click.self="emit('close')">
      <section class="modal">
        <header class="head" :style="tile.type === 'property' ? { '--title-color': ownerCharacterId ? ownerColor : '#60a5fa' } : {}">
          <div class="title-wrap">
            <h3>{{ tile.name }}</h3>
            <span v-if="tile.type === 'property'" class="zhou-chip">{{ tile.zhouAbbr }}</span>
          </div>
          <button type="button" class="close-btn" @click="emit('close')">✕</button>
        </header>

        <div class="body">
          <div class="owner-card">
            <span>所属</span>
            <template v-if="tile.type === 'property' && ownerCharacterId">
              <span class="owner-pill" :style="{ '--owner-color': ownerColor }">
                <img :src="ownerVisual.avatarUrl" :alt="ownerVisual.name" />
                <b>{{ ownerVisual.displayName }}</b>
              </span>
            </template>
            <template v-else-if="tile.type === 'property'">
              <span class="owner-empty">无主</span>
            </template>
            <template v-else>
              <span class="owner-empty">特殊地块</span>
            </template>
          </div>

          <template v-if="tile.type === 'property'">
            <div class="price-row">
              <span>💰 购买价</span>
              <strong>{{ tile.buyPrice }}</strong>
            </div>
            <div class="price-row">
              <span>🏠 升级价</span>
              <strong>{{ tile.upgradeCost }}</strong>
            </div>

            <div class="rent-panel">
              <h4>过路费（按建设等级）</h4>
              <div
                v-for="row in rentRows"
                :key="row.level"
                class="rent-row"
                :class="{ active: row.level === buildLevel }"
              >
                <span class="badge">{{ row.level }}</span>
                <span class="label">{{ row.label }}</span>
                <strong>🧾 {{ row.rent }}</strong>
              </div>
            </div>
          </template>

          <p class="hint">点击地块仅查看信息，不影响回合流程。</p>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(3px);
}
.modal {
  width: min(92vw, 480px);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.97), rgba(224, 242, 254, 0.92));
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.28);
  overflow: hidden;
}
.head {
  --title-color: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(120deg, color-mix(in srgb, var(--title-color) 28%, #fff), rgba(255, 255, 255, 0.7));
  border-bottom: 1px solid rgba(148, 163, 184, 0.45);
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
h3 {
  margin: 0;
  font-size: 19px;
  color: #0f172a;
}
.zhou-chip {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  color: #1d4ed8;
  font-weight: 800;
}
.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 0;
  background: #e2e8f0;
  cursor: pointer;
}
.body {
  padding: 14px;
  display: grid;
  gap: 10px;
}
.owner-card,
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(203, 213, 225, 0.9);
  padding: 9px 10px;
}
.owner-pill {
  --owner-color: #60a5fa;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--owner-color) 72%, #fff);
  background: color-mix(in srgb, var(--owner-color) 20%, #fff);
}
.owner-pill img {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #fff;
}
.owner-empty {
  color: #64748b;
}
.rent-panel {
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.74);
  padding: 10px;
}
.rent-panel h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #334155;
}
.rent-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 6px 8px;
}
.rent-row.active {
  background: rgba(186, 230, 253, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.45);
}
.badge {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  font-weight: 700;
}
.label {
  color: #475569;
}
.hint {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}
.tile-detail-fade-enter-active,
.tile-detail-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tile-detail-fade-enter-active .modal,
.tile-detail-fade-leave-active .modal {
  transition: transform 0.2s ease;
}
.tile-detail-fade-enter-from,
.tile-detail-fade-leave-to {
  opacity: 0;
}
.tile-detail-fade-enter-from .modal,
.tile-detail-fade-leave-to .modal {
  transform: translateY(8px) scale(0.96);
}
</style>
