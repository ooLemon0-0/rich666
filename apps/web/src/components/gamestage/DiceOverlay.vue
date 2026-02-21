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
const diceA = ref(1);
const diceB = ref(1);

const diceFaceA = computed(() => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][Math.max(0, Math.min(5, diceA.value - 1))]);
const diceFaceB = computed(() => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][Math.max(0, Math.min(5, diceB.value - 1))]);

function splitDice(total: number): [number, number] {
  const n = Math.floor(total);
  if (n >= 2 && n <= 12) {
    const minA = Math.max(1, n - 6);
    const maxA = Math.min(6, n - 1);
    const a = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
    return [a, n - a];
  }
  // Any-dice keeps legacy 1-6 value; keep two-dice animation stable.
  const c = Math.max(1, Math.min(6, n || 1));
  return [c, 1];
}

watch(
  () => props.event?.seq,
  (seq) => {
    if (!seq || !props.event) {
      return;
    }
    const [a, b] = splitDice(props.event.payload.value);
    diceA.value = a;
    diceB.value = b;
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
      <div class="dice-wrap">
        <div class="dice-box">
          <span class="face">{{ diceFaceA }}</span>
        </div>
        <div class="dice-box">
          <span class="face">{{ diceFaceB }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 12px;
  pointer-events: none;
}
.dice-wrap {
  display: flex;
  gap: 10px;
}
.dice-box {
  width: 78px;
  height: 78px;
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
  font-size: 42px;
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
