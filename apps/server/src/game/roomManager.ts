import {
  BOARD_SIZE,
  type Player,
  type PlayerId,
  type SelfRole,
  type Spectator,
  type RoomActionSuccessPayload,
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
  lastActivityAt: number;
}

interface PlayerRef {
  roomId: RoomId;
  playerId: PlayerId;
}

interface SpectatorRef {
  roomId: RoomId;
  spectatorId: string;
}

export type JoinRoomFailureCode = "ROOM_NOT_FOUND" | "ROOM_FULL" | "ROOM_ENDED" | "ROOM_MISMATCH";
export type RollFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_ENDED"
  | "ROOM_MISMATCH"
  | "NOT_YOUR_TURN"
  | "GAME_NOT_READY"
  | "ERR_INVALID_ACTION";
export type TradeFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_ENDED"
  | "ROOM_MISMATCH"
  | "NOT_YOUR_TURN"
  | "NOT_BUY_PHASE"
  | "TILE_NOT_BUYABLE"
  | "INSUFFICIENT_CASH"
  | "ERR_INVALID_ACTION";
export type ReconnectFailureCode = "ROOM_NOT_FOUND" | "ROOM_ENDED" | "ROOM_MISMATCH" | "PLAYER_NOT_FOUND";
export type RoomActionFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_ENDED"
  | "ROOM_MISMATCH"
  | "PLAYER_NOT_FOUND"
  | "CHAR_TAKEN"
  | "ERR_INVALID_ACTION"
  | "GAME_NOT_READY";

export interface JoinRoomResult {
  ok: boolean;
  state?: RoomState;
  role?: SelfRole;
  playerId?: string;
  reconnected?: boolean;
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
export interface RoomActionResult {
  ok: boolean;
  state?: RoomState;
  result?: RoomActionSuccessPayload;
  code?: RoomActionFailureCode;
}

const rooms = new Map<RoomId, RoomRecord>();
const endedRooms = new Set<RoomId>();
const socketToPlayer = new Map<string, PlayerRef>();
const socketToSpectator = new Map<string, SpectatorRef>();
const playerToSocket = new Map<string, string>();
const spectatorToSocket = new Map<string, string>();
const ROOM_SIZE_LIMIT = 6;
const DISCONNECTED_GRACE_MS = 60_000;
const ROOM_IDLE_TTL_MS = 10 * 60_000;

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

function randomSpectatorId(): string {
  return `S${randomId(8)}`;
}

function roomPlayerKey(roomId: RoomId, playerId: PlayerId): string {
  return `${roomId}:${playerId}`;
}

function roomSpectatorKey(roomId: RoomId, spectatorId: string): string {
  return `${roomId}:${spectatorId}`;
}

function generateUniqueRoomId(): RoomId {
  let roomId = randomId();
  while (rooms.has(roomId)) {
    roomId = randomId();
  }
  return roomId;
}

function buildPlayer(playerId: PlayerId, nickname: string, playerToken: string): Player {
  return {
    playerId,
    nickname,
    position: 0,
    cash: 1500,
    connected: true,
    joinedAt: Date.now(),
    ready: false,
    selectedCharacterId: null,
    playerToken,
    status: "active"
  };
}

function buildSpectator(nickname: string, playerToken: string): Spectator {
  return {
    spectatorId: randomSpectatorId(),
    nickname,
    connected: true,
    joinedAt: Date.now(),
    playerToken
  };
}

function computePhase(playersCount: number): RoomPhase {
  return playersCount >= 2 ? "rolling" : "waiting";
}

function touchRoom(record: RoomRecord): void {
  record.lastActivityAt = Date.now();
}

function destroyRoom(roomId: RoomId, reason: string): void {
  const record = rooms.get(roomId);
  if (!record) {
    return;
  }
  record.state.players.forEach((player) => {
    const key = roomPlayerKey(roomId, player.playerId);
    const socketId = playerToSocket.get(key);
    if (socketId) {
      socketToPlayer.delete(socketId);
    }
    playerToSocket.delete(key);
  });
  record.state.spectators.forEach((spectator) => {
    const key = roomSpectatorKey(roomId, spectator.spectatorId);
    const socketId = spectatorToSocket.get(key);
    if (socketId) {
      socketToSpectator.delete(socketId);
    }
    spectatorToSocket.delete(key);
  });
  rooms.delete(roomId);
  console.info(`[ROOM] destroyed: roomId=${roomId} reason=${reason}`);
}

function maybeDestroyRoom(roomId: RoomId): boolean {
  const record = rooms.get(roomId);
  if (!record) {
    return false;
  }
  const now = Date.now();
  const activePlayers = record.state.players.filter((player) => player.status === "active" && player.connected).length;
  const disconnectedPlayers = record.state.players.filter((player) => player.status === "disconnected").length;
  const connectedSpectators = record.state.spectators.filter((spectator) => spectator.connected).length;

  if (activePlayers === 0 && connectedSpectators === 0) {
    if (disconnectedPlayers === 0) {
      destroyRoom(roomId, "empty");
      return true;
    }
    if (now - record.lastActivityAt >= DISCONNECTED_GRACE_MS) {
      destroyRoom(roomId, "disconnected_grace_expired");
      return true;
    }
  }

  if (activePlayers === 0 && connectedSpectators === 0 && now - record.lastActivityAt >= ROOM_IDLE_TTL_MS) {
    destroyRoom(roomId, "idle_ttl");
    return true;
  }
  return false;
}

export function gcStaleRooms(): void {
  Array.from(rooms.keys()).forEach((roomId) => {
    maybeDestroyRoom(roomId);
  });
}

function createBoard(): Tile[] {
  return Array.from({ length: BOARD_SIZE }, (_unused, index) => {
    if (index === 0) {
      return {
        index,
        ownerPlayerId: null,
        ownerCharacterId: null,
        price: 0,
        rent: 0
      };
    }
    const price = 200 + index * 10;
    return {
      index,
      ownerPlayerId: null,
        ownerCharacterId: null,
      price,
      rent: Math.floor(price * 0.1)
    };
  });
}

export function createRoom(socketId: string, nickname: string, playerToken: string): RoomState {
  const player = buildPlayer(randomPlayerId(), nickname, playerToken);
  const roomId = generateUniqueRoomId();

  const state: RoomState = {
    roomId,
    status: "waiting",
    players: [player],
    hostPlayerId: player.playerId,
    currentTurnPlayerId: player.playerId,
    phase: "waiting",
    board: createBoard(),
    spectators: [],
    pendingBuyTileIndex: null,
    lastRoll: null
  };

  rooms.set(roomId, { state, lastActivityAt: Date.now() });
  endedRooms.delete(roomId);
  socketToPlayer.set(socketId, { roomId, playerId: player.playerId });
  playerToSocket.set(roomPlayerKey(roomId, player.playerId), socketId);

  return state;
}

export function joinRoom(socketId: string, roomId: RoomId, nickname: string, playerToken: string): JoinRoomResult {
  if (endedRooms.has(roomId)) {
    return { ok: false, code: "ROOM_ENDED" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }
  const existingPlayer = record.state.players.find((item) => item.playerToken === playerToken);
  if (existingPlayer) {
    if (existingPlayer.status === "left") {
      return { ok: false, code: "ROOM_MISMATCH" };
    }
    const oldSocketId = playerToSocket.get(roomPlayerKey(roomId, existingPlayer.playerId));
    if (oldSocketId && oldSocketId !== socketId) {
      socketToPlayer.delete(oldSocketId);
    }
    existingPlayer.connected = true;
    existingPlayer.status = "active";
    existingPlayer.nickname = nickname;
    touchRoom(record);
    socketToPlayer.set(socketId, { roomId, playerId: existingPlayer.playerId });
    playerToSocket.set(roomPlayerKey(roomId, existingPlayer.playerId), socketId);
    return { ok: true, state: record.state, role: "player", playerId: existingPlayer.playerId, reconnected: true };
  }

  const existingSpectator = record.state.spectators.find((item) => item.playerToken === playerToken);
  if (existingSpectator) {
    const oldSocketId = spectatorToSocket.get(roomSpectatorKey(roomId, existingSpectator.spectatorId));
    if (oldSocketId && oldSocketId !== socketId) {
      socketToSpectator.delete(oldSocketId);
    }
    existingSpectator.connected = true;
    existingSpectator.nickname = nickname;
    touchRoom(record);
    socketToSpectator.set(socketId, { roomId, spectatorId: existingSpectator.spectatorId });
    spectatorToSocket.set(roomSpectatorKey(roomId, existingSpectator.spectatorId), socketId);
    return {
      ok: true,
      state: record.state,
      role: "spectator",
      playerId: existingSpectator.spectatorId,
      reconnected: true
    };
  }

  if (record.state.status === "in_game") {
    const spectator = buildSpectator(nickname, playerToken);
    record.state.spectators.push(spectator);
    touchRoom(record);
    socketToSpectator.set(socketId, { roomId, spectatorId: spectator.spectatorId });
    spectatorToSocket.set(roomSpectatorKey(roomId, spectator.spectatorId), socketId);
    return { ok: true, state: record.state, role: "spectator", playerId: spectator.spectatorId };
  }

  if (record.state.players.length >= ROOM_SIZE_LIMIT) {
    return { ok: false, code: "ROOM_FULL" };
  }

  const player = buildPlayer(randomPlayerId(), nickname, playerToken);
  record.state.players.push(player);
  touchRoom(record);
  record.state.phase = "waiting";
  if (!record.state.currentTurnPlayerId) {
    record.state.currentTurnPlayerId = record.state.players[0]?.playerId ?? null;
  }
  socketToPlayer.set(socketId, { roomId, playerId: player.playerId });
  playerToSocket.set(roomPlayerKey(roomId, player.playerId), socketId);
  return { ok: true, state: record.state, role: "player", playerId: player.playerId };
}

export function getPlayerRefBySocket(socketId: string): PlayerRef | null {
  return socketToPlayer.get(socketId) ?? null;
}

export function disconnectSocket(socketId: string): RoomState | null {
  const playerRef = socketToPlayer.get(socketId);
  if (!playerRef) {
    const spectatorRef = socketToSpectator.get(socketId);
    if (!spectatorRef) {
      return null;
    }
    socketToSpectator.delete(socketId);
    const reverseKey = roomSpectatorKey(spectatorRef.roomId, spectatorRef.spectatorId);
    if (spectatorToSocket.get(reverseKey) === socketId) {
      spectatorToSocket.delete(reverseKey);
    }
    const spectatorRoom = rooms.get(spectatorRef.roomId);
    if (!spectatorRoom) {
      return null;
    }
    const spectator = spectatorRoom.state.spectators.find((item) => item.spectatorId === spectatorRef.spectatorId);
    if (spectator) {
      spectator.connected = false;
    }
    touchRoom(spectatorRoom);
    maybeDestroyRoom(spectatorRef.roomId);
    return spectatorRoom.state;
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
  if (player.status === "active") {
    player.status = "disconnected";
  }

  if (record.state.currentTurnPlayerId === player.playerId) {
    advanceTurn(record.state);
  } else {
    const connectedCount = record.state.players.filter((item) => item.connected).length;
    if (connectedCount < 2) {
      record.state.phase = "waiting";
      record.state.pendingBuyTileIndex = null;
    }
  }
  touchRoom(record);
  maybeDestroyRoom(playerRef.roomId);
  return record.state;
}

function randomDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function advanceTurn(state: RoomState): void {
  const connectedPlayers = state.players.filter((player) => player.connected);
  if (connectedPlayers.length < 2) {
    state.currentTurnPlayerId = connectedPlayers[0]?.playerId ?? null;
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
  if (endedRooms.has(roomId)) {
    return { ok: false, code: "ROOM_ENDED" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }
  if (record.state.status !== "in_game") {
    return { ok: false, code: "GAME_NOT_READY" };
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
    if (landedTile.ownerPlayerId && landedTile.ownerPlayerId !== player.playerId) {
      const owner = getCurrentPlayer(record.state, landedTile.ownerPlayerId);
      if (owner) {
        const payment = Math.min(player.cash, landedTile.rent);
        player.cash -= payment;
        owner.cash += payment;
      }
    }
  }
  // Server-authoritative turn state machine:
  // every valid roll resolves and immediately advances to next turn.
  advanceTurn(record.state);
  touchRoom(record);

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
  if (endedRooms.has(roomId)) {
    return { code: "ROOM_ENDED" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { code: "ROOM_NOT_FOUND" };
  }
  if (record.state.status !== "in_game") {
    return { code: "ERR_INVALID_ACTION" };
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
  tile.ownerCharacterId = validation.player.selectedCharacterId;
  advanceTurn(validation.state);
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }

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
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
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
  if (endedRooms.has(roomId)) {
    return { ok: false, code: "ROOM_ENDED" };
  }
  if (!record) {
    return { ok: false, code: "ROOM_NOT_FOUND" };
  }

  const player = record.state.players.find((item) => item.playerId === playerId);
  if (!player) {
    return { ok: false, code: "PLAYER_NOT_FOUND" };
  }
  if (player.status === "left") {
    return { ok: false, code: "ROOM_MISMATCH" };
  }

  const playerKey = roomPlayerKey(roomId, playerId);
  const oldSocketId = playerToSocket.get(playerKey);
  if (oldSocketId && oldSocketId !== socketId) {
    socketToPlayer.delete(oldSocketId);
  }

  socketToPlayer.set(socketId, { roomId, playerId });
  playerToSocket.set(playerKey, socketId);
  player.connected = true;
  player.status = "active";
  touchRoom(record);

  const connectedCount = record.state.players.filter((item) => item.connected).length;
  if (record.state.status === "in_game" && connectedCount >= 2 && record.state.phase === "waiting") {
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

function getPlayerRecord(socketId: string, roomId: RoomId): { state?: RoomState; player?: Player; code?: RoomActionFailureCode } {
  const playerRef = socketToPlayer.get(socketId);
  if (!playerRef) {
    return { code: "ROOM_NOT_FOUND" };
  }
  if (playerRef.roomId !== roomId) {
    return { code: "ROOM_MISMATCH" };
  }
  if (endedRooms.has(roomId)) {
    return { code: "ROOM_ENDED" };
  }
  const record = rooms.get(roomId);
  if (!record) {
    return { code: "ROOM_NOT_FOUND" };
  }
  const player = record.state.players.find((item) => item.playerId === playerRef.playerId);
  if (!player) {
    return { code: "PLAYER_NOT_FOUND" };
  }
  if (player.status === "left") {
    return { code: "ROOM_MISMATCH" };
  }
  return { state: record.state, player };
}

export function selectCharacter(
  socketId: string,
  roomId: RoomId,
  characterId: string
): RoomActionResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  if (entry.state.status !== "waiting") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (!characterId.trim()) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const nextCharacterId = characterId.trim();
  const takenByOther = entry.state.players.some(
    (item) => item.playerId !== entry.player?.playerId && item.selectedCharacterId === nextCharacterId
  );
  if (takenByOther) {
    return { ok: false, code: "CHAR_TAKEN" };
  }
  entry.player.selectedCharacterId = nextCharacterId;
  entry.player.ready = false;
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
  return {
    ok: true,
    state: entry.state,
    result: {
      ok: true,
      roomId,
      playerId: entry.player.playerId,
      action: "select_character"
    }
  };
}

export function toggleReady(socketId: string, roomId: RoomId): RoomActionResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  if (entry.state.status !== "waiting") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (!entry.player.selectedCharacterId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  entry.player.ready = !entry.player.ready;
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
  return {
    ok: true,
    state: entry.state,
    result: {
      ok: true,
      roomId,
      playerId: entry.player.playerId,
      action: "toggle_ready"
    }
  };
}

export function startGame(socketId: string, roomId: RoomId): RoomActionResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  if (entry.state.status !== "waiting") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (entry.state.hostPlayerId !== entry.player.playerId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const connectedPlayers = entry.state.players.filter((item) => item.connected);
  if (connectedPlayers.length < 2) {
    return { ok: false, code: "GAME_NOT_READY" };
  }
  if (!connectedPlayers.every((item) => item.ready)) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  entry.state.status = "in_game";
  entry.state.phase = computePhase(connectedPlayers.length);
  if (!entry.state.currentTurnPlayerId) {
    entry.state.currentTurnPlayerId = connectedPlayers[0].playerId;
  }
  entry.state.pendingBuyTileIndex = null;
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
  return {
    ok: true,
    state: entry.state,
    result: {
      ok: true,
      roomId,
      playerId: entry.player.playerId,
      action: "start_game"
    }
  };
}

export function leaveRoom(socketId: string, roomId: RoomId, playerToken: string): RoomActionResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  if (entry.player.playerToken !== playerToken.trim()) {
    return { ok: false, code: "ROOM_MISMATCH" };
  }
  if (entry.player.status === "left") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }

  entry.player.status = "left";
  entry.player.connected = false;
  entry.player.ready = false;

  if (entry.state.hostPlayerId === entry.player.playerId) {
    const nextHost = entry.state.players.find((item) => item.status !== "left");
    entry.state.hostPlayerId = nextHost?.playerId ?? entry.state.hostPlayerId;
  }

  if (entry.state.currentTurnPlayerId === entry.player.playerId) {
    advanceTurn(entry.state);
  }
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
  maybeDestroyRoom(roomId);

  return {
    ok: true,
    state: entry.state,
    result: {
      ok: true,
      roomId,
      playerId: entry.player.playerId,
      action: "leave_room"
    }
  };
}
