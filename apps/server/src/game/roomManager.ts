import {
  BOARD_SIZE,
  type Player,
  type PlayerId,
  type ReconnectSuccessPayload,
  type RollSuccessPayload,
  type RoomPhase,
  type RoomId,
  type RoomState,
  type Tile,
  type TradeActionSuccessPayload
} from "@rich/shared";

interface RoomRecord {
  state: RoomState;
}

interface PlayerRef {
  roomId: RoomId;
  playerId: PlayerId;
}

export type JoinRoomFailureCode = "ROOM_NOT_FOUND" | "ROOM_FULL";
export type RollFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_MISMATCH"
  | "NOT_YOUR_TURN"
  | "GAME_NOT_READY";
export type TradeFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_MISMATCH"
  | "NOT_YOUR_TURN"
  | "NOT_BUY_PHASE"
  | "TILE_NOT_BUYABLE"
  | "INSUFFICIENT_CASH";
export type ReconnectFailureCode = "ROOM_NOT_FOUND" | "ROOM_MISMATCH" | "PLAYER_NOT_FOUND";

export interface JoinRoomResult {
  ok: boolean;
  state?: RoomState;
  code?: JoinRoomFailureCode;
}

export interface RollResult {
  ok: boolean;
  state?: RoomState;
  result?: RollSuccessPayload;
  code?: RollFailureCode;
}

export interface TradeResult {
  ok: boolean;
  state?: RoomState;
  result?: TradeActionSuccessPayload;
  code?: TradeFailureCode;
}

export interface ReconnectResult {
  ok: boolean;
  state?: RoomState;
  result?: ReconnectSuccessPayload;
  code?: ReconnectFailureCode;
  kickedSocketId?: string;
}

const rooms = new Map<RoomId, RoomRecord>();
const socketToPlayer = new Map<string, PlayerRef>();
const playerToSocket = new Map<string, string>();
const ROOM_SIZE_LIMIT = 6;

function randomId(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function randomPlayerId(): PlayerId {
  return `P${randomId(8)}`;
}

function roomPlayerKey(roomId: RoomId, playerId: PlayerId): string {
  return `${roomId}:${playerId}`;
}

function generateUniqueRoomId(): RoomId {
  let roomId = randomId();
  while (rooms.has(roomId)) {
    roomId = randomId();
  }
  return roomId;
}

function buildPlayer(playerId: PlayerId, nickname: string): Player {
  return {
    playerId,
    nickname,
    position: 0,
    cash: 1500,
    connected: true,
    joinedAt: Date.now()
  };
}

function computePhase(playersCount: number): RoomPhase {
  return playersCount >= 2 ? "rolling" : "waiting";
}

function createBoard(): Tile[] {
  return Array.from({ length: BOARD_SIZE }, (_unused, index) => {
    if (index === 0) {
      return {
        index,
        ownerPlayerId: null,
        price: 0,
        rent: 0
      };
    }
    const price = 200 + index * 10;
    return {
      index,
      ownerPlayerId: null,
      price,
      rent: Math.floor(price * 0.1)
    };
  });
}

export function createRoom(socketId: string, nickname: string): RoomState {
  const player = buildPlayer(randomPlayerId(), nickname);
  const roomId = generateUniqueRoomId();

  const state: RoomState = {
    roomId,
    players: [player],
    hostPlayerId: player.playerId,
    currentTurnPlayerId: player.playerId,
    phase: "waiting",
    board: createBoard(),
    pendingBuyTileIndex: null,
    lastRoll: null
  };

  rooms.set(roomId, { state });
  socketToPlayer.set(socketId, { roomId, playerId: player.playerId });
  playerToSocket.set(roomPlayerKey(roomId, player.playerId), socketId);

  return state;
}

export function joinRoom(socketId: string, roomId: RoomId, nickname: string): JoinRoomResult {
  const record = rooms.get(roomId);
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }
  if (record.state.players.length >= ROOM_SIZE_LIMIT) {
    return { ok: false, code: "ROOM_FULL" };
  }

  const player = buildPlayer(randomPlayerId(), nickname);
  record.state.players.push(player);
  record.state.phase = computePhase(record.state.players.length);
  if (!record.state.currentTurnPlayerId) {
    record.state.currentTurnPlayerId = record.state.players[0]?.playerId ?? null;
  }
  socketToPlayer.set(socketId, { roomId, playerId: player.playerId });
  playerToSocket.set(roomPlayerKey(roomId, player.playerId), socketId);
  return { ok: true, state: record.state };
}

export function getPlayerRefBySocket(socketId: string): PlayerRef | null {
  return socketToPlayer.get(socketId) ?? null;
}

export function disconnectSocket(socketId: string): RoomState | null {
  const playerRef = socketToPlayer.get(socketId);
  if (!playerRef) {
    return null;
  }

  socketToPlayer.delete(socketId);
  const reverseKey = roomPlayerKey(playerRef.roomId, playerRef.playerId);
  if (playerToSocket.get(reverseKey) === socketId) {
    playerToSocket.delete(reverseKey);
  }
  const record = rooms.get(playerRef.roomId);
  if (!record) {
    return null;
  }

  const player = record.state.players.find((item) => item.playerId === playerRef.playerId);
  if (!player) {
    return record.state;
  }
  player.connected = false;

  if (record.state.currentTurnPlayerId === player.playerId) {
    advanceTurn(record.state);
  } else {
    const connectedCount = record.state.players.filter((item) => item.connected).length;
    if (connectedCount < 2) {
      record.state.phase = "waiting";
      record.state.pendingBuyTileIndex = null;
    }
  }
  return record.state;
}

function randomDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function advanceTurn(state: RoomState): void {
  const connectedPlayers = state.players.filter((player) => player.connected);
  if (connectedPlayers.length < 2) {
    state.phase = "waiting";
    state.pendingBuyTileIndex = null;
    return;
  }
  const currentId = state.currentTurnPlayerId;
  if (!currentId) {
    state.currentTurnPlayerId = state.players[0].playerId;
    state.phase = "rolling";
    state.pendingBuyTileIndex = null;
    return;
  }
  const currentIndex = state.players.findIndex((player) => player.playerId === currentId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIndex];
  if (nextPlayer.connected) {
    state.currentTurnPlayerId = nextPlayer.playerId;
  } else {
    const fallback = state.players.find((player) => player.connected) ?? null;
    state.currentTurnPlayerId = fallback?.playerId ?? null;
  }
  state.phase = "rolling";
  state.pendingBuyTileIndex = null;
}

function getCurrentPlayer(state: RoomState, playerId: PlayerId): Player | null {
  return state.players.find((player) => player.playerId === playerId) ?? null;
}

export function rollRequest(socketId: string, roomId: RoomId): RollResult {
  const playerRef = socketToPlayer.get(socketId);
  if (!playerRef) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }
  if (playerRef.roomId !== roomId) {
    return { ok: false, code: "ROOM_MISMATCH" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }
  if (record.state.phase === "waiting" || record.state.players.length < 2) {
    return { ok: false, code: "GAME_NOT_READY" };
  }
  if (record.state.phase !== "rolling") {
    return { ok: false, code: "NOT_YOUR_TURN" };
  }
  if (record.state.currentTurnPlayerId !== playerRef.playerId) {
    return { ok: false, code: "NOT_YOUR_TURN" };
  }

  const currentPlayerIndex = record.state.players.findIndex(
    (player) => player.playerId === playerRef.playerId
  );
  if (currentPlayerIndex < 0) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }

  const dice = randomDice();
  const player = record.state.players[currentPlayerIndex];
  const nextPosition = (player.position + dice) % BOARD_SIZE;

  record.state.phase = "moving";
  player.position = nextPosition;
  record.state.lastRoll = {
    playerId: player.playerId,
    value: dice
  };
  record.state.pendingBuyTileIndex = null;

  const landedTile = record.state.board[nextPosition];
  if (landedTile.index !== 0) {
    if (!landedTile.ownerPlayerId) {
      record.state.phase = "can_buy";
      record.state.pendingBuyTileIndex = landedTile.index;
    } else if (landedTile.ownerPlayerId !== player.playerId) {
      const owner = getCurrentPlayer(record.state, landedTile.ownerPlayerId);
      if (owner) {
        const payment = Math.min(player.cash, landedTile.rent);
        player.cash -= payment;
        owner.cash += payment;
      }
      advanceTurn(record.state);
    } else {
      advanceTurn(record.state);
    }
  } else {
    advanceTurn(record.state);
  }

  return {
    ok: true,
    state: record.state,
    result: {
      ok: true,
      roomId,
      playerId: player.playerId,
      dice,
      position: nextPosition
    }
  };
}

function validateTradeRequest(socketId: string, roomId: RoomId): { state?: RoomState; player?: Player; code?: TradeFailureCode } {
  const playerRef = socketToPlayer.get(socketId);
  if (!playerRef) {
    return { code: "ROOM_NOT_FOUND" };
  }
  if (playerRef.roomId !== roomId) {
    return { code: "ROOM_MISMATCH" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { code: "ROOM_NOT_FOUND" };
  }
  if (record.state.currentTurnPlayerId !== playerRef.playerId) {
    return { code: "NOT_YOUR_TURN" };
  }
  if (record.state.phase !== "can_buy") {
    return { code: "NOT_BUY_PHASE" };
  }
  const player = getCurrentPlayer(record.state, playerRef.playerId);
  if (!player) {
    return { code: "ROOM_NOT_FOUND" };
  }
  return { state: record.state, player };
}

export function buyRequest(socketId: string, roomId: RoomId): TradeResult {
  const validation = validateTradeRequest(socketId, roomId);
  if (!validation.state || !validation.player) {
    return { ok: false, code: validation.code ?? "ROOM_NOT_FOUND" };
  }

  const tileIndex = validation.state.pendingBuyTileIndex;
  if (tileIndex === null) {
    return { ok: false, code: "TILE_NOT_BUYABLE" };
  }
  const tile = validation.state.board[tileIndex];
  if (!tile || tile.index === 0 || tile.ownerPlayerId) {
    return { ok: false, code: "TILE_NOT_BUYABLE" };
  }
  if (validation.player.position !== tile.index) {
    return { ok: false, code: "TILE_NOT_BUYABLE" };
  }
  if (validation.player.cash < tile.price) {
    return { ok: false, code: "INSUFFICIENT_CASH" };
  }

  validation.player.cash -= tile.price;
  tile.ownerPlayerId = validation.player.playerId;
  advanceTurn(validation.state);

  return {
    ok: true,
    state: validation.state,
    result: {
      ok: true,
      roomId,
      playerId: validation.player.playerId,
      action: "buy"
    }
  };
}

export function skipBuy(socketId: string, roomId: RoomId): TradeResult {
  const validation = validateTradeRequest(socketId, roomId);
  if (!validation.state || !validation.player) {
    return { ok: false, code: validation.code ?? "ROOM_NOT_FOUND" };
  }

  advanceTurn(validation.state);
  return {
    ok: true,
    state: validation.state,
    result: {
      ok: true,
      roomId,
      playerId: validation.player.playerId,
      action: "skip_buy"
    }
  };
}

export function reconnectPlayer(
  socketId: string,
  roomId: RoomId,
  playerId: PlayerId
): ReconnectResult {
  const record = rooms.get(roomId);
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }

  const player = record.state.players.find((item) => item.playerId === playerId);
  if (!player) {
    return { ok: false, code: "PLAYER_NOT_FOUND" };
  }

  const playerKey = roomPlayerKey(roomId, playerId);
  const oldSocketId = playerToSocket.get(playerKey);
  if (oldSocketId && oldSocketId !== socketId) {
    socketToPlayer.delete(oldSocketId);
  }

  socketToPlayer.set(socketId, { roomId, playerId });
  playerToSocket.set(playerKey, socketId);
  player.connected = true;

  const connectedCount = record.state.players.filter((item) => item.connected).length;
  if (connectedCount >= 2 && record.state.phase === "waiting") {
    record.state.phase = "rolling";
    if (!record.state.currentTurnPlayerId) {
      record.state.currentTurnPlayerId = playerId;
    }
  }

  return {
    ok: true,
    state: record.state,
    result: { ok: true, roomId, playerId },
    kickedSocketId: oldSocketId && oldSocketId !== socketId ? oldSocketId : undefined
  };
}
