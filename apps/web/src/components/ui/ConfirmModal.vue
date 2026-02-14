<script setup lang="ts">
defineProps<{
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="mask" @click.self="emit('cancel')">
      <section class="modal">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="actions">
          <button type="button" class="ghost" @click="emit('cancel')">{{ cancelText ?? "取消" }}</button>
          <button type="button" class="danger" @click="emit('confirm')">{{ confirmText ?? "确定" }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(2px);
  padding: 16px;
}
.modal {
  width: min(92vw, 420px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(170deg, #f8fafc, #e2e8f0);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.24);
  padding: 14px;
}
h3 {
  margin: 0;
  color: #0f172a;
}
p {
  margin: 8px 0 0;
  color: #334155;
}
.actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
button {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}
button.ghost {
  background: #cbd5e1;
  color: #0f172a;
}
button.danger {
  background: linear-gradient(180deg, #f43f5e, #e11d48);
  color: #fff;
}
</style>
