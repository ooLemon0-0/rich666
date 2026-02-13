<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { playSfx } from "../../utils/sfx";

interface DiceEventPayload {
  roomId: string;
  playerId: string;
  value: number;
}

const props = defineProps<{
  event: { seq: number; payload: DiceEventPayload } | null;
}>();

const visible = ref(false);
const currentValue = ref(1);

const diceFace = computed(() => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][Math.max(0, Math.min(5, currentValue.value - 1))]);

watch(
  () => props.event?.seq,
  (seq) => {
    if (!seq || !props.event) {
      return;
    }
    currentValue.value = props.event.payload.value;
    visible.value = true;
    playSfx("dice_roll");
    window.setTimeout(() => {
      playSfx("dice_land");
    }, 350);
    window.setTimeout(() => {
      visible.value = false;
    }, 1000);
  }
);
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="dice-box">
        <span class="face">{{ diceFace }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.dice-box {
  width: 110px;
  height: 110px;
  border-radius: 22px;
  border: 3px solid rgba(251, 191, 36, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(254, 249, 195, 0.95));
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.35),
    0 0 22px rgba(251, 191, 36, 0.55);
  display: grid;
  place-items: center;
  animation: rollBounce 0.95s ease;
}
.face {
  font-size: 54px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes rollBounce {
  0% {
    transform: scale(0.6) rotate(-20deg);
  }
  35% {
    transform: scale(1.12) rotate(18deg);
  }
  60% {
    transform: scale(0.96) rotate(-8deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
</style>
