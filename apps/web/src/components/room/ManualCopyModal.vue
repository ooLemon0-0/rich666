<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
  text: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

function selectAll(): void {
  inputRef.value?.focus();
  inputRef.value?.select();
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }
    await nextTick();
    selectAll();
  }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="mask" @click.self="emit('close')">
      <section class="modal">
        <h3>手动复制邀请链接</h3>
        <p>当前环境无法自动复制，请手动复制下方链接。</p>
        <input ref="inputRef" class="copy-input" :value="text" readonly />
        <div class="actions">
          <button type="button" class="ghost" @click="emit('close')">关闭</button>
          <button type="button" class="primary" @click="selectAll">全选</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(2px);
  padding: 16px;
}
.modal {
  width: min(92vw, 520px);
  border-radius: 18px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  background: linear-gradient(170deg, #f0f9ff, #dbeafe);
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.22);
  padding: 14px;
}
h3 {
  margin: 0;
  color: #1e3a8a;
}
p {
  margin: 8px 0 10px;
  color: #334155;
  font-size: 13px;
}
.copy-input {
  width: 100%;
  border: 1px solid #93c5fd;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  color: #0f172a;
  background: #fff;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
button {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}
button.ghost {
  background: #e2e8f0;
  color: #0f172a;
}
button.primary {
  background: linear-gradient(180deg, #2563eb, #1d4ed8);
  color: #fff;
}
</style>
