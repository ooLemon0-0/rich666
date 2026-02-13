<script setup lang="ts">
type TabValue = "create" | "join";

const props = defineProps<{
  modelValue: TabValue;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: TabValue];
}>();

const tabs: Array<{ label: string; value: TabValue }> = [
  { label: "创建战局", value: "create" },
  { label: "加入战局", value: "join" }
];
</script>

<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="tab-btn"
      :class="{ active: props.modelValue === tab.value }"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 4px;
  border: 1px solid rgba(225, 198, 154, 0.65);
  gap: 4px;
}

.tab-btn {
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-weight: 700;
  color: #7c6f64;
  cursor: pointer;
}

.tab-btn.active {
  background: linear-gradient(90deg, #f59e0b, #f97316);
  color: #fff;
  box-shadow: 0 8px 15px rgba(245, 158, 11, 0.35);
}
</style>
