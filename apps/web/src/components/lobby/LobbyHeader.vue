<script setup lang="ts">
import { computed } from "vue";
import { GAME_CONFIG } from "../../config/game";

const props = defineProps<{
  status: "disconnected" | "connecting" | "connected";
}>();

const statusText = computed(() => {
  if (props.status === "connected") {
    return "在线";
  }
  if (props.status === "connecting") {
    return "连接中";
  }
  return "离线";
});
</script>

<template>
  <header class="lobby-header">
    <div>
      <p class="logo">三国大富翁</p>
      <p class="subtitle">{{ GAME_CONFIG.title }} · 群雄并起，富甲天下</p>
    </div>
    <div class="status-pill" :class="`status-${status}`">
      <span class="dot" />
      <span>{{ statusText }}</span>
    </div>
  </header>
</template>

<style scoped>
.lobby-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.logo {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #7c2d12;
}

.subtitle {
  margin: 4px 0 0;
  color: #7c6f64;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: currentcolor;
}

.status-connected {
  color: #166534;
  background: rgba(220, 252, 231, 0.75);
  border: 1px solid rgba(134, 239, 172, 0.8);
}

.status-connecting {
  color: #9a3412;
  background: rgba(254, 215, 170, 0.75);
  border: 1px solid rgba(251, 191, 36, 0.8);
}

.status-disconnected {
  color: #991b1b;
  background: rgba(254, 202, 202, 0.75);
  border: 1px solid rgba(252, 165, 165, 0.8);
}
</style>
