<script setup lang="ts">
defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  roll: [];
}>();
</script>

<template>
  <button class="dice-btn" type="button" :disabled="disabled" @click="emit('roll')">
    <span class="dice-icon">🎲</span>
  </button>
</template>

<style scoped>
.dice-btn {
  position: absolute;
  right: 16px;
  bottom: 14px;
  width: 66px;
  height: 66px;
  border: 0;
  border-radius: 16px;
  cursor: pointer;
  background: linear-gradient(180deg, #f59e0b, #ea580c);
  box-shadow:
    0 8px 0 #c2410c,
    0 14px 24px rgba(15, 23, 42, 0.3);
  transition: transform 0.16s ease;
  z-index: 8;
}
.dice-btn:hover {
  transform: translateY(-3px) scale(1.04);
}
.dice-btn:active {
  transform: translateY(2px) scale(0.98);
}
.dice-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dice-icon {
  font-size: 30px;
  filter: drop-shadow(0 2px 0 rgba(255, 255, 255, 0.35));
}
</style>
