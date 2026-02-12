<script setup lang="ts">
import { computed } from "vue";
import { BOARD_SIZE } from "@rich/shared";
import { useRoomStore } from "../stores/room";

const roomStore = useRoomStore();

const currentTurnPlayerName = computed(() => {
  if (!roomStore.roomState || !roomStore.currentTurnPlayerId) {
    return "-";
  }
  const player = roomStore.roomState.players.find(
    (item) => item.playerId === roomStore.currentTurnPlayerId
  );
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

async function handleRoll() {
  await roomStore.rollDice();
}

async function handleBuy() {
  await roomStore.buyCurrentTile();
}

async function handleSkipBuy() {
  await roomStore.skipBuy();
}
</script>

<template>
  <section class="panel" v-if="roomStore.roomState">
    <div class="row">
      <h2>Room</h2>
      <button class="ghost" @click="roomStore.leaveRoom">退出房间</button>
    </div>

    <p><strong>roomId：</strong>{{ roomStore.roomState.roomId }}</p>
    <p><strong>房主 playerId：</strong>{{ roomStore.roomState.hostPlayerId }}</p>
    <p><strong>当前回合玩家：</strong>{{ currentTurnPlayerName }}</p>
    <p><strong>房间阶段：</strong>{{ roomStore.roomState.phase }}</p>
    <p><strong>我的现金：</strong>{{ roomStore.selfPlayer?.cash ?? 0 }}</p>
    <p>
      <strong>最近骰子：</strong>
      <span v-if="roomStore.roomState.lastRoll">
        {{ roomStore.roomState.lastRoll.playerId }} 掷出 {{ roomStore.roomState.lastRoll.value }}
      </span>
      <span v-else>-</span>
    </p>
    <p>
      <strong>连接状态：</strong>
      {{ roomStore.connectionStatus }}
    </p>
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
    <p class="hint" v-if="!roomStore.canRoll">只有当前回合玩家可以掷骰，结果由服务端计算并广播。</p>
    <p v-if="roomStore.error" class="error">{{ roomStore.error }}</p>

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

    <h3>玩家列表</h3>
    <ul class="players">
      <li v-for="player in roomStore.roomState.players" :key="player.playerId">
        <span>{{ player.nickname }}</span>
        <span class="muted">({{ player.playerId }})</span>
        <span class="muted">位置 {{ player.position }}</span>
        <span class="muted">现金 {{ player.cash }}</span>
        <span v-if="player.playerId === roomStore.playerId" class="tag">我</span>
        <span v-if="player.playerId === roomStore.roomState.hostPlayerId" class="tag host">房主</span>
        <span v-if="player.playerId === roomStore.currentTurnPlayerId" class="tag turn">当前回合</span>
      </li>
    </ul>
  </section>
</template>
