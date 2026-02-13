<script setup lang="ts">
const modelValue = defineModel<string>({ required: true });
</script>

<template>
  <label class="room-code-input">
    <span>房间号</span>
    <input
      v-model="modelValue"
      maxlength="8"
      autocomplete="off"
      placeholder="例如 AB12CD"
      @input="modelValue = modelValue.toUpperCase().replace(/[^A-Z0-9]/g, '')"
    />
  </label>
</template>

<style scoped>
.room-code-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #422006;
  font-weight: 700;
}

input {
  width: 100%;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 11px 12px;
  font-size: 18px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: #1f2937;
  outline: none;
  background: #fffbeb;
}

input:focus-visible {
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.18);
}
</style>
