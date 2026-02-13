<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  modelValue: string;
  pending: boolean;
  recentRooms: string[];
  alertMessage: string;
  alertType: "info" | "error" | "success";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
  "use-recent": [roomId: string];
}>();

const inputRefs = ref<Array<HTMLInputElement | null>>([]);
const chars = computed(() =>
  Array.from({ length: 6 }, (_unused, index) => props.modelValue[index] ?? "")
);
const normalizedCode = computed(() => props.modelValue.trim().toUpperCase());
const canSubmit = computed(() => normalizedCode.value.length === 6 && !props.pending);

function focusAt(index: number) {
  inputRefs.value[index]?.focus();
}

function updateByChar(index: number, raw: string) {
  const char = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1);
  const arr = chars.value.slice();
  arr[index] = char;
  const next = arr.join("").trim();
  emit("update:modelValue", next);
  if (char && index < 5) {
    focusAt(index + 1);
  }
}

function handleBackspace(index: number, event: Event) {
  const keyboardEvent = event as KeyboardEvent;
  if (keyboardEvent.key !== "Backspace") {
    return;
  }
  if (chars.value[index]) {
    return;
  }
  if (index > 0) {
    focusAt(index - 1);
  }
}

function handlePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData("text") ?? "";
  const next = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  emit("update:modelValue", next);
}

function submit() {
  if (!canSubmit.value) {
    return;
  }
  emit("submit");
}
</script>

<template>
  <section class="join-panel">
    <p class="title">邀请码</p>
    <div class="code-grid" @paste.prevent="handlePaste">
      <input
        v-for="(char, index) in chars"
        :key="index"
        :ref="
          (el) => {
            inputRefs[index] = el as HTMLInputElement | null;
          }
        "
        class="code-box"
        maxlength="1"
        inputmode="text"
        :value="char"
        @input="updateByChar(index, ($event.target as HTMLInputElement).value)"
        @keydown="handleBackspace(index, $event)"
      />
    </div>

    <button type="button" class="join-btn" :disabled="!canSubmit" @click="submit">
      {{ pending ? "加入中..." : "加入战局" }}
    </button>

    <div class="alert" :class="`alert-${alertType}`">
      {{ alertMessage }}
    </div>

    <div class="recent">
      <p class="recent-title">最近房间</p>
      <div class="recent-list">
        <button
          v-for="room in props.recentRooms"
          :key="room"
          type="button"
          class="recent-item"
          @click="emit('use-recent', room)"
        >
          {{ room }}
        </button>
        <p v-if="props.recentRooms.length === 0" class="empty">暂无最近房间</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.join-panel {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(225, 198, 154, 0.65);
  padding: 14px;
}

.title {
  margin: 0 0 10px;
  color: #7c2d12;
  font-weight: 700;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.code-box {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e6d3ad;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 251, 240, 0.95);
}

.join-btn {
  width: 100%;
  margin-top: 12px;
  height: 42px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  background: linear-gradient(90deg, #f97316, #f59e0b);
  color: white;
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  margin-top: 10px;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
}

.alert-info {
  background: rgba(219, 234, 254, 0.8);
  color: #1d4ed8;
}

.alert-success {
  background: rgba(220, 252, 231, 0.8);
  color: #166534;
}

.alert-error {
  background: rgba(254, 226, 226, 0.8);
  color: #991b1b;
}

.recent {
  margin-top: 14px;
}

.recent-title {
  margin: 0 0 8px;
  color: #7c6f64;
  font-size: 13px;
}

.recent-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recent-item {
  border: 1px solid #efdab5;
  background: #fff;
  color: #8b5a2b;
  border-radius: 999px;
  padding: 5px 10px;
  cursor: pointer;
}

.empty {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}
</style>
