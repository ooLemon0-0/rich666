import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { DiceRolledPayload, RoomState } from "@rich/shared";
import { createSocketClient, type ConnectionStatus } from "../socket";

function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function randomGuestName(): string {
  return `玩家${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const useRoomStore = defineStore("room_ui", () => {
  const socketClient = createSocketClient();
  const roomState = ref<RoomState | null>(null);
  const playerId = ref("");
  const nickname = ref(randomGuestName());
  const connectionStatus = ref<ConnectionStatus>(socketClient.getStatus());
  const showJoinModal = ref(false);
  const showCharacterModal = ref(false);
  const localError = ref("");
  const connectionLastError = ref("");
  const actionPending = ref(false);
  const rollingPending = ref(false);
  const tradePending = ref(false);
  const lastJoinErrorCode = ref("");
  const diceRolledEvent = ref<{ seq: number; payload: DiceRolledPayload } | null>(null);
  let diceSeq = 0;

  socketClient.subscribeRoomState((state) => {
    roomState.value = state;
  });
  socketClient.subscribeConnection((status) => {
    connectionStatus.value = status;
    if (status === "connected") {
      connectionLastError.value = "";
    }
  });
  socketClient.subscribeError((socketError) => {
    localError.value = socketError.message;
    lastJoinErrorCode.value = socketError.code;
    connectionLastError.value = socketError.message;
  });
  socketClient.subscribeDiceRolled((payload) => {
    diceSeq += 1;
    diceRolledEvent.value = { seq: diceSeq, payload };
  });

  const roomId = computed(() => roomState.value?.roomId ?? "");
  const inRoom = computed(() => Boolean(roomState.value));
  const roomStatus = computed(() => roomState.value?.status ?? "waiting");
  const maxPlayers = 6;
  const players = computed(() => roomState.value?.players ?? []);
  const selfPlayer = computed(() => players.value.find((item) => item.playerId === playerId.value) ?? null);
  const selfPlayerId = computed(() => playerId.value);
  const selectedCharacterId = computed(() => selfPlayer.value?.selectedCharacterId ?? null);
  const connectedPlayersCount = computed(() => players.value.filter((item) => item.connected).length);
  const takenCharacterIdsByOthers = computed(() =>
    players.value
      .filter((item) => item.playerId !== playerId.value && Boolean(item.selectedCharacterId))
      .map((item) => item.selectedCharacterId as string)
  );
  const isHost = computed(
    () => Boolean(roomState.value && playerId.value && roomState.value.hostPlayerId === playerId.value)
  );
  const allPlayersReady = computed(
    () => players.value.filter((item) => item.connected).length > 0 &&
      players.value.filter((item) => item.connected).every((item) => item.ready)
  );
  const canReady = computed(() => Boolean(selectedCharacterId.value));
  const canStart = computed(
    () =>
      roomStatus.value === "waiting" &&
      isHost.value &&
      connectedPlayersCount.value >= 2 &&
      allPlayersReady.value
  );
  const startButtonLabel = computed(() => {
    if (connectedPlayersCount.value < 2) {
      return "等待玩家加入";
    }
    if (!allPlayersReady.value) {
      return "等待玩家准备";
    }
    return "开始游戏";
  });
  const startButtonDisabled = computed(
    () =>
      connectedPlayersCount.value < 2 || !allPlayersReady.value || !isHost.value || roomStatus.value !== "waiting"
  );
  const entryErrorTitle = computed(() => {
    if (lastJoinErrorCode.value === "ROOM_ENDED") {
      return "房间已结束";
    }
    return "房间不存在";
  });
  const entryErrorDesc = computed(() => {
    if (lastJoinErrorCode.value === "ROOM_ENDED") {
      return "该链接对应的房间已结束，请返回大厅重新创建或加入新房间。";
    }
    return "该链接可能已失效或输入有误，请返回大厅重新创建或加入。";
  });
  const connectionHint = computed(() => {
    if (connectionStatus.value === "connected") {
      return "连接正常";
    }
    if (connectionStatus.value === "connecting") {
      return "正在连接服务器...";
    }
    return connectionLastError.value ? `连接断开：${connectionLastError.value}` : "连接断开";
  });

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
      roomStatus.value === "in_game" &&
      roomState.value?.phase === "rolling" &&
      roomState.value.currentTurnPlayerId === playerId.value
  );
  const canBuy = computed(() => {
    if (!roomState.value || !currentTile.value || !selfPlayer.value) {
      return false;
    }
    return (
      roomStatus.value === "in_game" &&
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
      roomStatus.value === "in_game" &&
      roomState.value?.phase === "can_buy" &&
      roomState.value.currentTurnPlayerId === playerId.value
  );

  function openJoinModal(): void {
    localError.value = "";
    lastJoinErrorCode.value = "";
    showJoinModal.value = true;
  }

  function closeJoinModal(): void {
    showJoinModal.value = false;
  }

  function onJoinSuccess(nextPlayerId: string): void {
    playerId.value = nextPlayerId;
    showCharacterModal.value = true;
    showJoinModal.value = false;
    localError.value = "";
    lastJoinErrorCode.value = "";
  }

  async function createRoom(): Promise<boolean> {
    actionPending.value = true;
    localError.value = "";
    lastJoinErrorCode.value = "";
    if (!nickname.value.trim()) {
      nickname.value = randomGuestName();
    }
    socketClient.clearSession();
    socketClient.connect();
    const result = await socketClient.createRoom(nickname.value);
    actionPending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      lastJoinErrorCode.value = result.code;
      return false;
    }
    socketClient.setSession({ roomId: result.roomId, playerId: result.playerId });
    onJoinSuccess(result.playerId);
    return true;
  }

  async function joinRoom(inputRoomId: string): Promise<boolean> {
    const normalized = normalizeRoomCode(inputRoomId);
    if (!normalized) {
      localError.value = "请输入有效房间号（仅支持 A-Z / 0-9）";
      lastJoinErrorCode.value = "INVALID_PAYLOAD";
      return false;
    }
    actionPending.value = true;
    localError.value = "";
    lastJoinErrorCode.value = "";
    if (!nickname.value.trim()) {
      nickname.value = randomGuestName();
    }
    socketClient.clearSession();
    socketClient.connect();
    const result = await socketClient.joinRoom(normalized, nickname.value);
    actionPending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      lastJoinErrorCode.value = result.code;
      return false;
    }
    socketClient.setSession({ roomId: result.roomId, playerId: result.playerId });
    onJoinSuccess(result.playerId);
    return true;
  }

  async function selectCharacter(characterId: string): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    if (connectionStatus.value !== "connected") {
      localError.value = "连接未就绪，请稍后重试";
      return false;
    }
    actionPending.value = true;
    const result = await socketClient.selectCharacter(roomId.value, characterId);
    actionPending.value = false;
    if (!result.ok) {
      if (result.code === "CHAR_TAKEN") {
        localError.value = "该角色刚刚被其他玩家选择，请选择其它角色";
      } else if (result.code === "ROOM_NOT_FOUND") {
        localError.value = "房间不存在";
      } else if (result.code === "ROOM_MISMATCH") {
        localError.value = "你当前不在该房间";
      } else if (result.code === "SOCKET_DISCONNECTED") {
        localError.value = "连接未就绪，请稍后重试";
      } else if (result.code === "TIMEOUT") {
        localError.value = "请求超时，请检查网络或重试";
      } else {
        localError.value = result.message;
      }
      return false;
    }
    localError.value = "";
    return true;
  }

  async function toggleReady(): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    actionPending.value = true;
    const result = await socketClient.toggleReady(roomId.value);
    actionPending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      return false;
    }
    localError.value = "";
    return true;
  }

  async function startGame(): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    actionPending.value = true;
    const result = await socketClient.startGame(roomId.value);
    actionPending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      return false;
    }
    localError.value = "";
    return true;
  }

  function closeCharacterModalIfSelected(): void {
    if (selectedCharacterId.value) {
      showCharacterModal.value = false;
    }
  }

  function closeCharacterModal(): void {
    showCharacterModal.value = false;
  }

  function openCharacterModal(): void {
    if (!roomState.value || roomStatus.value !== "waiting") {
      return;
    }
    showCharacterModal.value = true;
    localError.value = "";
  }

  function backToLobby(): void {
    socketClient.disconnect();
    socketClient.clearSession();
    roomState.value = null;
    playerId.value = "";
    showJoinModal.value = false;
    showCharacterModal.value = false;
    localError.value = "";
    lastJoinErrorCode.value = "";
    rollingPending.value = false;
    tradePending.value = false;
  }

  async function rollDice(): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    rollingPending.value = true;
    const result = await socketClient.rollRequest(roomId.value);
    rollingPending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      return false;
    }
    localError.value = "";
    return true;
  }

  async function buyCurrentTile(): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    tradePending.value = true;
    const result = await socketClient.buyRequest(roomId.value);
    tradePending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      return false;
    }
    localError.value = "";
    return true;
  }

  async function skipBuy(): Promise<boolean> {
    if (!roomId.value) {
      localError.value = "当前不在房间内";
      return false;
    }
    tradePending.value = true;
    const result = await socketClient.skipBuy(roomId.value);
    tradePending.value = false;
    if (!result.ok) {
      localError.value = result.message;
      return false;
    }
    localError.value = "";
    return true;
  }

  const storedSession = socketClient.getSession();
  if (storedSession) {
    playerId.value = storedSession.playerId;
    socketClient.connect();
  }

  return {
    actionPending,
    allPlayersReady,
    canBuy,
    canReady,
    canRoll,
    canSkipBuy,
    canStart,
    connectionHint,
    connectionLastError,
    connectionStatus,
    currentTile,
    currentTurnPlayerId,
    entryErrorDesc,
    entryErrorTitle,
    inRoom,
    isHost,
    lastJoinErrorCode,
    localError,
    nickname,
    playerId,
    players,
    rollingPending,
    diceRolledEvent,
    roomId,
    roomState,
    roomStatus,
    maxPlayers,
    connectedPlayersCount,
    selfPlayer,
    selfPlayerId,
    selectedCharacterId,
    showCharacterModal,
    showJoinModal,
    tradePending,
    backToLobby,
    buyCurrentTile,
    closeCharacterModalIfSelected,
    closeCharacterModal,
    closeJoinModal,
    createRoom,
    joinRoom,
    openCharacterModal,
    openJoinModal,
    rollDice,
    selectCharacter,
    skipBuy,
    startGame,
    toggleReady,
    takenCharacterIdsByOthers,
    startButtonLabel,
    startButtonDisabled
  };
});
