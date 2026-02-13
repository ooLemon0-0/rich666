<script setup lang="ts">
defineProps<{
  avatarUrl: string;
  color: string;
  size?: number;
}>();
</script>

<template>
  <span class="token-avatar" :style="{ '--token-color': color, width: `${size ?? 22}px`, height: `${size ?? 22}px` }">
    <img :src="avatarUrl" alt="token avatar" />
  </span>
</template>

<style scoped>
.token-avatar {
  display: inline-flex;
  border-radius: 999px;
  border: 2px solid var(--token-color);
  box-shadow:
    0 0 10px color-mix(in srgb, var(--token-color) 55%, transparent),
    0 2px 6px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  background: #fff;
}
.token-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
