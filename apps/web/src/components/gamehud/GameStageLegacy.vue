<script setup lang="ts">
import { computed } from "vue";
import { BOARD_SIZE } from "@rich/shared";
import { useRoomStore } from "../../stores/roomStore";

const roomStore = useRoomStore();

const currentTurnPlayerName = computed(() => {
  if (!roomStore.roomState || !roomStore.currentTurnPlayerId) {
    return "-";
  }
  const player = roomStore.roomState.players.find((item) => item.playerId === roomStore.currentTurnPlayerId);
  return player?.nickname ?? roomStore.currentTurnPlayerId;
});

const ownerNameById = computed(() => {
  const map = new Map<string, string>();
  if (!roomStore.roomState) {
    return map;
  }
  roomStore.roomState.players.forEach((player) => {
    map.set(player.playerId, player.nickname);
  });
  return map;
});

const boardCells = computed(() => {
  const state = roomStore.roomState;
  return Array.from({ length: BOARD_SIZE }, (_unused, index) => {
    const players = state ? state.players.filter((player) => player.position === index) : [];
    const tile = state?.board[index];
    return { index, players, tile };
  });
});

function playerColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i += 1) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue} 75% 45%)`;
}

async function handleRoll(): Promise<void> {
  await roomStore.rollDice();
}

async function handleBuy(): Promise<void> {
  await roomStore.buyCurrentTile();
}

async function handleSkipBuy(): Promise<void> {
  await roomStore.skipBuy();
}
</script>

<template>
  <section class="legacy-stage" v-if="roomStore.roomState">
    <div class="stats">
      <p><strong>roomId：</strong>{{ roomStore.roomState.roomId }}</p>
      <p><strong>当前回合：</strong>{{ currentTurnPlayerName }}</p>
      <p><strong>阶段：</strong>{{ roomStore.roomState.phase }}</p>
      <p><strong>我的现金：</strong>{{ roomStore.selfPlayer?.cash ?? 0 }}</p>
    </div>

    <div class="actions">
      <button :disabled="!roomStore.canRoll || roomStore.rollingPending" @click="handleRoll">
        {{ roomStore.rollingPending ? "掷骰中..." : "掷骰" }}
      </button>
    </div>

    <div class="tile-panel" v-if="roomStore.currentTile">
      <p><strong>当前落点：</strong>#{{ roomStore.currentTile.index }}</p>
      <p>
        <strong>地块所有者：</strong>
        <span v-if="roomStore.currentTile.ownerPlayerId">
          {{ ownerNameById.get(roomStore.currentTile.ownerPlayerId) ?? roomStore.currentTile.ownerPlayerId }}
        </span>
        <span v-else>无人拥有</span>
      </p>
      <p><strong>价格：</strong>{{ roomStore.currentTile.price }}</p>
      <p><strong>租金：</strong>{{ roomStore.currentTile.rent }}</p>
      <div class="actions" v-if="roomStore.canSkipBuy">
        <button :disabled="!roomStore.canBuy || roomStore.tradePending" @click="handleBuy">
          {{ roomStore.tradePending ? "处理中..." : "购买" }}
        </button>
        <button class="ghost" :disabled="roomStore.tradePending" @click="handleSkipBuy">跳过</button>
      </div>
    </div>

    <h3>棋盘（20格）</h3>
    <div class="board-grid">
      <div class="cell" v-for="cell in boardCells" :key="cell.index">
        <div class="cell-title">#{{ cell.index }}</div>
        <div class="cell-owner" v-if="cell.tile?.ownerPlayerId">
          {{ ownerNameById.get(cell.tile.ownerPlayerId) ?? "已拥有" }}
        </div>
        <div class="tokens">
          <span
            v-for="player in cell.players"
            :key="player.playerId"
            class="token"
            :style="{ backgroundColor: playerColor(player.playerId) }"
            :title="player.nickname"
          >
            {{ player.nickname.slice(0, 1).toUpperCase() }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.legacy-stage {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(191, 219, 254, 0.9);
  border-radius: 16px;
  padding: 12px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
}
.stats p {
  margin: 0;
}
.actions {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}
button {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
}
button.ghost {
  background: #cbd5e1;
  color: #0f172a;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.tile-panel {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
}
.board-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.cell {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 8px;
  min-height: 68px;
  background: #f8fafc;
}
.cell-title {
  color: #334155;
  font-size: 12px;
  margin-bottom: 6px;
}
.cell-owner {
  font-size: 12px;
  color: #7c3aed;
  margin-bottom: 6px;
}
.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.token {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  text-align: center;
}
</style>
