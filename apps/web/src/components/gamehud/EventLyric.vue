<script setup lang="ts">
import { ref } from "vue";

interface LyricItem {
  id: number;
  text: string;
  type?: string;
}

const events = ref<LyricItem[]>([]);
let seed = 1;

function pushEvent(text: string, type = "normal"): void {
  const next: LyricItem = { id: seed, text, type };
  seed += 1;
  events.value = [next, ...events.value].slice(0, 6);
}

defineExpose({
  pushEvent
});
</script>

<template>
  <section class="event-lyric">
    <h3>事件歌词流</h3>
    <transition-group name="lyric" tag="ul" class="list">
      <li v-for="(item, index) in events" :key="item.id" class="line" :class="`lv-${index}`">
        <span class="text">{{ item.text }}</span>
      </li>
    </transition-group>
  </section>
</template>

<style scoped>
.event-lyric {
  border-radius: 14px;
  padding: 12px;
  border: 2px solid rgba(167, 243, 208, 0.8);
  background: rgba(255, 255, 255, 0.88);
  min-height: 280px;
}
h3 {
  margin: 0 0 8px;
  color: #065f46;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.line {
  position: relative;
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(134, 239, 172, 0.7);
  background: #f0fdf4;
  overflow: hidden;
  transform-origin: top right;
  transition: all 0.25s ease;
}
.line::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-140%) skewX(-22deg);
  background: linear-gradient(100deg, transparent 35%, rgba(255, 255, 255, 0.42), transparent 65%);
}
.line.lv-0 {
  transform: scale(1.08);
  box-shadow: 0 0 18px rgba(16, 185, 129, 0.36);
}
.line.lv-0::before {
  animation: sweep 0.55s ease;
}
.line.lv-1,
.line.lv-2 {
  transform: scale(1);
}
.line.lv-3 {
  transform: scale(0.92);
  opacity: 0.7;
  filter: blur(0.3px);
}
.line.lv-4 {
  transform: scale(0.88);
  opacity: 0.55;
  filter: blur(0.6px);
}
.line.lv-5 {
  transform: scale(0.84);
  opacity: 0.4;
  filter: blur(1px);
}
.text {
  color: #14532d;
  font-size: 14px;
  font-weight: 700;
}
.lyric-enter-active,
.lyric-leave-active {
  transition: all 0.3s ease;
}
.lyric-enter-from {
  opacity: 0;
  transform: translateX(22px) scale(1.12);
}
.lyric-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.85);
}
@keyframes sweep {
  from {
    transform: translateX(-140%) skewX(-22deg);
  }
  to {
    transform: translateX(140%) skewX(-22deg);
  }
}
</style>
