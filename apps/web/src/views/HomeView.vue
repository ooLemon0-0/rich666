<script setup lang="ts">
import { ref } from "vue";
import { useRoomStore } from "../stores/room";

const roomStore = useRoomStore();
const nickname = ref("玩家A");
const roomId = ref("");

async function handleCreateRoom() {
  await roomStore.createRoom(nickname.value);
}

async function handleJoinRoom() {
  await roomStore.joinRoom(roomId.value, nickname.value);
}
</script>

<template>
  <section class="panel">
    <h2>Home</h2>
    <p class="hint">输入昵称后可创建房间或加入已有房间。</p>

    <label class="form-item">
      昵称
      <input v-model.trim="nickname" placeholder="请输入昵称" />
    </label>

    <div class="actions">
      <button :disabled="roomStore.pending" @click="handleCreateRoom">创建房间</button>
    </div>

    <label class="form-item">
      房间号
      <input v-model.trim="roomId" placeholder="例如 ABC123" />
    </label>

    <div class="actions">
      <button :disabled="roomStore.pending" @click="handleJoinRoom">加入房间</button>
    </div>

    <p class="status">
      连接状态：
      <strong>{{ roomStore.connectionStatus }}</strong>
    </p>
    <p v-if="roomStore.error" class="error">{{ roomStore.error }}</p>
  </section>
</template>
