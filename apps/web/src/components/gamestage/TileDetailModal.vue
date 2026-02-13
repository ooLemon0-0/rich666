<script setup lang="ts">
import { computed } from "vue";
import type { PropertyTile } from "../../game/board/boardConfig";
import { getCharacterVisual } from "../../game/characters/characters";
import { getCharacterColor } from "../../game/characters/characterPalette";

const props = defineProps<{
  open: boolean;
  tile: PropertyTile | null;
  ownerCharacterId: string | null;
  canBuy: boolean;
  buying: boolean;
}>();

const emit = defineEmits<{
  close: [];
  buy: [];
}>();

const ownerVisual = computed(() => getCharacterVisual(props.ownerCharacterId));
const ownerColor = computed(() => getCharacterColor(props.ownerCharacterId));
</script>

<template>
  <Transition name="tile-modal-fade">
    <div v-if="open && tile" class="overlay" @click.self="emit('close')">
      <section class="modal">
        <header class="head">
          <div class="title-wrap">
            <span class="title-icon">📜</span>
            <div>
              <h3>{{ tile.nameZh }}</h3>
              <p>{{ tile.zhouName }}地契</p>
            </div>
          </div>
          <button class="close-btn" type="button" @click="emit('close')">✕</button>
        </header>

        <div class="body">
          <div class="zhou-chip">{{ tile.zhouKey }}</div>

          <div class="row"><span>当前等级</span><strong>Lv.{{ tile.level }}</strong></div>
          <div class="row"><span>购买价格</span><strong class="gold">🪙 {{ tile.price }}</strong></div>
          <div class="row"><span>过路费</span><strong class="gold">🪙 {{ tile.toll }}</strong></div>
          <div class="row"><span>建设费用</span><strong class="gold">🪙 {{ tile.buildCost }}</strong></div>

          <div class="owner-row">
            <span>当前所有者</span>
            <template v-if="ownerCharacterId">
              <span class="owner-pill" :style="{ '--owner-color': ownerColor }">
                <img :src="ownerVisual.avatarUrl" :alt="ownerVisual.name" />
                <b>{{ ownerVisual.name }}</b>
                <small>已归属</small>
              </span>
            </template>
            <template v-else>
              <span class="owner-empty">无主（可购买）</span>
            </template>
          </div>
        </div>

        <footer class="foot">
          <button v-if="canBuy" class="buy-btn" :disabled="buying" type="button" @click="emit('buy')">
            {{ buying ? "购买中..." : "购买" }}
          </button>
          <button v-if="canBuy" class="ghost-btn" type="button" @click="emit('close')">取消</button>
          <button v-else class="ghost-btn" type="button" @click="emit('close')">关闭</button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.26);
  backdrop-filter: blur(3px);
}
.modal {
  width: min(92vw, 420px);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.82);
  background:
    radial-gradient(circle at 20% 0, rgba(255, 255, 255, 0.35), transparent 35%),
    linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%);
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.28);
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.5);
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  font-size: 18px;
}
h3 {
  margin: 0;
  font-size: 17px;
  color: #0f172a;
}
p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #475569;
}
.close-btn {
  border: 0;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #e2e8f0;
  cursor: pointer;
}
.body {
  padding: 12px 14px;
  display: grid;
  gap: 8px;
}
.zhou-chip {
  justify-self: start;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #92400e;
  font-weight: 800;
}
.row,
.owner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(203, 213, 225, 0.8);
  padding: 8px 10px;
  font-size: 13px;
}
.gold {
  color: #b45309;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}
.owner-pill {
  --owner-color: #60a5fa;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--owner-color) 75%, #fff);
  background: color-mix(in srgb, var(--owner-color) 20%, #fff);
}
.owner-pill img {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #fff;
}
.owner-pill b {
  font-size: 12px;
}
.owner-pill small {
  font-size: 11px;
  color: #334155;
}
.owner-empty {
  color: #64748b;
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.42);
}
.buy-btn,
.ghost-btn {
  border: 0;
  border-radius: 12px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 700;
}
.buy-btn {
  color: #fff;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 6px 12px rgba(22, 163, 74, 0.3);
}
.ghost-btn {
  color: #0f172a;
  background: #e2e8f0;
}
.buy-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.tile-modal-fade-enter-active,
.tile-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tile-modal-fade-enter-active .modal,
.tile-modal-fade-leave-active .modal {
  transition: transform 0.2s ease;
}
.tile-modal-fade-enter-from,
.tile-modal-fade-leave-to {
  opacity: 0;
}
.tile-modal-fade-enter-from .modal,
.tile-modal-fade-leave-to .modal {
  transform: translateY(8px) scale(0.96);
}
</style>
