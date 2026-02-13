<script setup lang="ts">
import { ref, watch } from "vue";
import RoomCodeInput from "./RoomCodeInput.vue";

const props = defineProps<{
  modelValue: boolean;
  errorText: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [roomId: string];
}>();

const roomCode = ref("");

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      roomCode.value = "";
    }
  }
);

function close(): void {
  emit("update:modelValue", false);
}

function confirmJoin(): void {
  emit("confirm", roomCode.value);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="mask" @click.self="close">
      <section class="modal">
        <header class="modal-head">
          <h3>加入房间</h3>
          <button class="close-btn" type="button" @click="close">×</button>
        </header>
        <p class="tip">输入房间号后即可入局（支持 A-Z / 0-9）。</p>
        <RoomCodeInput v-model="roomCode" />
        <p v-if="errorText" class="error">{{ errorText }}</p>
        <footer class="actions">
          <button class="btn ghost" type="button" @click="close">取消</button>
          <button class="btn primary" type="button" @click="confirmJoin">确认加入</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 40;
  padding: 16px;
}

.modal {
  width: min(460px, 100%);
  border-radius: 20px;
  border: 3px solid #f59e0b;
  background: linear-gradient(180deg, #fff7ed, #fffbeb);
  box-shadow: 0 26px 40px rgba(30, 41, 59, 0.35);
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f59e0b, #f97316);
  color: #fff;
}

h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 0;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.tip {
  color: #7c2d12;
  margin: 14px 16px 6px;
}

.error {
  margin: 8px 16px 0;
  color: #dc2626;
  font-weight: 700;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px 18px;
}

.btn {
  min-width: 110px;
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.ghost {
  background: #fed7aa;
  color: #7c2d12;
}

.btn.primary {
  color: #fff;
  background: linear-gradient(180deg, #f59e0b, #ea580c);
}
</style>
