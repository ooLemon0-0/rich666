import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { RoomState } from "@rich/shared";
import { createSocketClient, type ConnectionStatus } from "../socket";

const PLAYER_TOKEN_KEY = "rich:player-token";

function getOrCreatePlayerToken(): string {
  const cached = localStorage.getItem(PLAYER_TOKEN_KEY)?.trim();
  if (cached) {
    return cached;
  }
  const token = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(PLAYER_TOKEN_KEY, token);
  return token;
}

export const useRoomStore = defineStore("room", () => {
  const socketClient = createSocketClient();
  const roomState = ref<RoomState | null>(null);
  const playerId = ref("");
  const nickname = ref("");
  const connectionStatus = ref<ConnectionStatus>(socketClient.getStatus());
  const error = ref("");
  const pending = ref(false);
  const rollingPending = ref(false);
  const tradePending = ref(false);

  socketClient.subscribeRoomState((state) => {
    roomState.value = state;
  });
  socketClient.subscribeError((socketError) => {
    error.value = socketError.message;
    // Keep UX simple for now: show immediate toast-like alert.
    window.alert(`${socketError.code}: ${socketError.message}`);
  });
  socketClient.subscribeConnection((status) => {
    connectionStatus.value = status;
  });

  async function createRoom(name: string): Promise<boolean> {
    const nextName = name.trim();
    if (!nextName) {
      error.value = "昵称不能为空";
      return false;
    }
    pending.value = true;
    error.value = "";
    nickname.value = nextName;
    socketClient.connect();
    const result = await socketClient.createRoom(nextName, getOrCreatePlayerToken());
    pending.value = false;
    if (!result.ok) {
      error.value = result.message;
      return false;
    }
    playerId.value = result.playerId;
    socketClient.setSession({ roomId: result.roomId, playerId: result.playerId });
    return true;
  }

  async function joinRoom(targetRoomId: string, name: string): Promise<boolean> {
    const nextName = name.trim();
    const nextRoomId = targetRoomId.trim().toUpperCase();
    if (!nextName || !nextRoomId) {
      error.value = "roomId 和昵称不能为空";
      return false;
    }
    pending.value = true;
    error.value = "";
    nickname.value = nextName;
    socketClient.connect();
    const result = await socketClient.joinRoom(nextRoomId, nextName, getOrCreatePlayerToken());
    pending.value = false;
    if (!result.ok) {
      error.value = result.message;
      return false;
    }
    playerId.value = result.playerId;
    socketClient.setSession({ roomId: result.roomId, playerId: result.playerId });
    return true;
  }

  function leaveRoom(): void {
    socketClient.disconnect();
    roomState.value = null;
    playerId.value = "";
    pending.value = false;
    rollingPending.value = false;
    tradePending.value = false;
    socketClient.clearSession();
  }

  async function rollDice(): Promise<boolean> {
    if (!roomState.value?.roomId) {
      error.value = "当前不在房间内";
      return false;
    }
    rollingPending.value = true;
    error.value = "";
    const result = await socketClient.rollRequest(roomState.value.roomId);
    rollingPending.value = false;
    if (!result.ok) {
      error.value = result.message;
      return false;
    }
    return true;
  }

  async function buyCurrentTile(): Promise<boolean> {
    if (!roomState.value?.roomId) {
      error.value = "当前不在房间内";
      return false;
    }
    tradePending.value = true;
    error.value = "";
    const result = await socketClient.buyRequest(roomState.value.roomId);
    tradePending.value = false;
    if (!result.ok) {
      error.value = result.message;
      return false;
    }
    return true;
  }

  async function skipBuy(): Promise<boolean> {
    if (!roomState.value?.roomId) {
      error.value = "当前不在房间内";
      return false;
    }
    tradePending.value = true;
    error.value = "";
    const result = await socketClient.skipBuy(roomState.value.roomId);
    tradePending.value = false;
    if (!result.ok) {
      error.value = result.message;
      return false;
    }
    return true;
  }

  const inRoom = computed(() => Boolean(roomState.value));
  const roomId = computed(() => roomState.value?.roomId ?? "");
  const currentTurnPlayerId = computed(() => roomState.value?.currentTurnPlayerId ?? null);
  const currentTile = computed(() => {
    if (!roomState.value || !playerId.value) {
      return null;
    }
    const self = roomState.value.players.find((player) => player.playerId === playerId.value);
    if (!self) {
      return null;
    }
    return roomState.value.board[self.position] ?? null;
  });
  const canRoll = computed(
    () =>
      Boolean(roomState.value) &&
      roomState.value?.phase === "rolling" &&
      roomState.value.currentTurnPlayerId === playerId.value
  );
  const selfPlayer = computed(() =>
    roomState.value?.players.find((p) => p.playerId === playerId.value) ?? null
  );

  // Auto reconnect on refresh if local session exists.
  const storedSession = socketClient.getSession();
  if (storedSession) {
    playerId.value = storedSession.playerId;
    socketClient.connect();
  }
  const canBuy = computed(() => {
    if (!roomState.value || !currentTile.value || !selfPlayer.value) {
      return false;
    }
    return (
      roomState.value.phase === "can_buy" &&
      roomState.value.currentTurnPlayerId === playerId.value &&
      currentTile.value.index !== 0 &&
      !currentTile.value.ownerPlayerId &&
      selfPlayer.value.cash >= currentTile.value.price
    );
  });
  const canSkipBuy = computed(
    () =>
      Boolean(roomState.value) &&
      roomState.value?.phase === "can_buy" &&
      roomState.value.currentTurnPlayerId === playerId.value
  );

  return {
    roomState,
    playerId,
    nickname,
    connectionStatus,
    error,
    pending,
    rollingPending,
    tradePending,
    inRoom,
    roomId,
    currentTurnPlayerId,
    currentTile,
    canRoll,
    canBuy,
    canSkipBuy,
    selfPlayer,
    createRoom,
    joinRoom,
    rollDice,
    buyCurrentTile,
    skipBuy,
    leaveRoom
  };
});
