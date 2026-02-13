<script setup lang="ts">
import { playSfx } from "../../utils/sfx";

defineProps<{
  name: string;
  avatarPath: string;
  selected: boolean;
  locked: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

function handleHover(): void {
  playSfx("hover");
}
</script>

<template>
  <button
    class="character-card"
    :class="{ selected, locked }"
    type="button"
    :disabled="locked"
    @mouseenter="handleHover"
    @click="emit('select')"
  >
    <img :src="avatarPath" :alt="name" />
    <strong>{{ name }}</strong>
    <span v-if="selected" class="badge">✓</span>
    <span v-else-if="locked" class="badge lock">🔒</span>
  </button>
</template>

<style scoped>
.character-card {
  position: relative;
  border: 2px solid rgba(148, 163, 184, 0.8);
  background: #f8fafc;
  border-radius: 14px;
  padding: 6px;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.character-card::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-140%) skewX(-20deg);
  background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.35), transparent 65%);
  transition: transform 0.38s ease;
}

.character-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.14);
  border-color: #93c5fd;
}

.character-card:hover::before {
  transform: translateX(140%) skewX(-20deg);
}

.character-card.selected {
  border-color: #0ea5e9;
  background: linear-gradient(180deg, #ecfeff, #dbeafe);
  box-shadow:
    0 0 0 3px rgba(14, 165, 233, 0.2),
    0 10px 22px rgba(14, 165, 233, 0.2);
}

.character-card.locked {
  cursor: not-allowed;
  filter: grayscale(0.65);
  opacity: 0.62;
}

.character-card.locked::before {
  display: none;
}

img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 6px;
}

strong {
  display: block;
  font-size: 12px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #10b981;
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  font-weight: 800;
}

.badge.lock {
  background: #334155;
}

button:disabled {
  pointer-events: auto;
}
</style>
