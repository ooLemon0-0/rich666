<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRoomStore } from "../stores/roomStore";

const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();

const loading = ref(true);
const joinFailed = ref(false);

const targetRoomId = computed(() => String(route.params.roomId ?? ""));

async function tryJoin(): Promise<void> {
  loading.value = true;
  joinFailed.value = false;
  const ok = await roomStore.joinRoom(targetRoomId.value);
  loading.value = false;
  if (ok) {
    if (roomStore.roomStatus === "in_game") {
      await router.replace({ name: "game", params: { roomId: roomStore.roomId } });
      return;
    }
    await router.replace({ name: "waiting" });
    return;
  }
  joinFailed.value = true;
}

onMounted(async () => {
  await tryJoin();
});
</script>

<template>
  <section class="entry-screen">
    <div class="card">
      <template v-if="loading">
        <h1>正在加入房间...</h1>
        <p>房间号：{{ targetRoomId.toUpperCase() }}</p>
      </template>
      <template v-else-if="joinFailed">
        <h1>{{ roomStore.entryErrorTitle }}</h1>
        <p>{{ roomStore.entryErrorDesc }}</p>
        <p v-if="roomStore.localError" class="error">{{ roomStore.localError }}</p>
        <div class="actions">
          <button class="btn primary" type="button" @click="router.push({ name: 'lobby' })">返回大厅</button>
          <button class="btn ghost" type="button" @click="tryJoin">重新尝试</button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.entry-screen {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 16px;
}

.card {
  width: min(560px, 100%);
  border-radius: 22px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.25);
  padding: 28px 22px;
  color: #fff;
}

h1 {
  margin: 0 0 8px;
  font-size: clamp(24px, 4.4vw, 34px);
}

p {
  margin: 0 0 8px;
  color: #e0f2fe;
}

.error {
  color: #fca5a5;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(180deg, #f59e0b, #ea580c);
  color: #fff;
}

.btn.ghost {
  background: #dbeafe;
  color: #1e3a8a;
}
</style>
