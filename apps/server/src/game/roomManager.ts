import {
  type GodId,
  type ItemId,
  type PlayerItem,
  type TradeOfferEventPayload,
  type GameLandingResolvedPayload,
  type GameItemAnnouncementPayload,
  type PendingActionType,
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
import { getTileConfig, getTileDisplayName } from "./tilesConfig.js";
import { BOARD_TILE_COUNT } from "./tilesConfig.js";
import { checkTileSpecialHook } from "./specialHook.js";

interface RoomRecord {
  state: RoomState;
  lastActivityAt: number;
  pendingActionTimeout: NodeJS.Timeout | null;
}

interface PlayerRef {
  roomId: RoomId;
  playerId: PlayerId;
}

interface SpectatorRef {
  roomId: RoomId;
  spectatorId: string;
}
interface PendingTradeOffer {
  tradeId: string;
  roomId: RoomId;
  fromPlayerId: PlayerId;
  toPlayerId: PlayerId;
  givePropertyIndexes: number[];
  takePropertyIndexes: number[];
  giveCash: number;
  takeCash: number;
  giveItems: string[];
  takeItems: string[];
  createdAt: number;
}
interface UseItemResult {
  ok: boolean;
  state?: RoomState;
  result?: { roomId: RoomId; playerId: PlayerId; itemId: ItemId; consumed: boolean };
  roll?: RollSuccessPayload;
  events?: string[];
  announcements?: GameItemAnnouncementPayload[];
  code?: TradeOfferFailureCode | RollFailureCode;
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
export type TradeOfferFailureCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_ENDED"
  | "ROOM_MISMATCH"
  | "NOT_YOUR_TURN"
  | "GAME_NOT_READY"
  | "ERR_INVALID_ACTION"
  | "PLAYER_NOT_FOUND"
  | "CHAR_TAKEN"
  | "INSUFFICIENT_CASH";

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
  landing?: GameLandingResolvedPayload;
  events?: string[];
  announcements?: GameItemAnnouncementPayload[];
  code?: RollFailureCode;
}

export interface TradeResult {
  ok: boolean;
  state?: RoomState;
  result?: TradeActionSuccessPayload;
  events?: string[];
  code?: TradeFailureCode;
}

type DecisionType = "BUY_CONFIRM" | "BUY_SKIP" | "UPGRADE_CONFIRM" | "UPGRADE_SKIP" | "SHOP_CONFIRM" | "SHOP_SKIP";

interface ItemShopOffer {
  itemId: ItemId;
  price: number;
  description: string;
}

type FateEventId =
  | "gain_cash"
  | "lose_cash"
  | "steal_from_all"
  | "give_to_all"
  | "sell_one_property"
  | "god_bless"
  | "gain_item"
  | "lose_item"
  | "nanman"
  | "go_jail"
  | "move_to_start";

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
export interface TradeOfferResult {
  ok: boolean;
  state?: RoomState;
  offer?: PendingTradeOffer;
  events?: string[];
  code?: TradeOfferFailureCode;
}

const rooms = new Map<RoomId, RoomRecord>();
const endedRooms = new Set<RoomId>();
const socketToPlayer = new Map<string, PlayerRef>();
const socketToSpectator = new Map<string, SpectatorRef>();
const playerToSocket = new Map<string, string>();
const spectatorToSocket = new Map<string, string>();
const pendingTimeoutQueue: Array<{
  roomId: RoomId;
  events: string[];
  announcements?: GameItemAnnouncementPayload[];
}> = [];
const pendingTradeByRoom = new Map<RoomId, PendingTradeOffer>();
const ROOM_SIZE_LIMIT = 6;
const DISCONNECTED_GRACE_MS = 60_000;
const ROOM_IDLE_TTL_MS = 10 * 60_000;
const PENDING_ACTION_TIMEOUT_MS = 5_000;
const MIN_INITIAL_CASH = 15_000;
const MAX_INITIAL_CASH = 100_000;
const GOD_DURATION_TURNS = 5;
let pendingActionSeq = 0;
const CHARACTER_NAME_MAP: Record<string, string> = {
  caocao: "曹操",
  zhugeliang: "诸葛亮",
  liubei: "刘备",
  taishici: "太史慈",
  guanyu: "关羽",
  zhangfei: "张飞",
  zhaoyun: "赵云",
  diaochan: "貂蝉",
  lvbu: "吕布",
  machao: "马超",
  simayi: "司马懿",
  wanglang: "王朗",
  luxun: "陆逊",
  hejin: "何进",
  jiangwei: "姜维",
  pangtong: "庞统"
};
const GOD_NAME_MAP: Record<GodId, string> = {
  land_god: "土地神",
  fortune_god: "财神",
  poor_god: "穷神",
  holy_mary: "圣母玛丽亚",
  liu_dehua: "狂杀小朋友的刘德华"
};
const GOD_POOL: GodId[] = ["land_god", "fortune_god", "poor_god", "holy_mary", "liu_dehua"];
const ITEM_EFFECT_DESC_MAP: Record<ItemId, string> = {
  any_dice: "指定本回合骰子点数（1-6）。",
  steal_card: "夺取4格内目标的随机1个道具。",
  turtle_card: "令目标接下来3回合固定掷出1点。",
  outlaw_card: "下次遭遇其他角色时抢走其15%金钱。",
  god_bless: "随机请神上身5回合，触发对应神力。",
  banish_god: "送走自己或4格内目标身上的神。",
  auction_card: "将当前位置地产打回平地并清空归属。",
  build_card: "指定自己的地产免费升级1级。",
  equal_poor_card: "让目标金钱降到与最穷者一致。",
  equal_rich_card: "让自己金钱升到与最富者一致。",
  nanman_card: "全员损失 其地产数量×100 金。",
  frame_card: "将4格内目标送入监狱3回合。"
};
const ITEM_NAME_MAP: Record<ItemId, string> = {
  any_dice: "任意骰子",
  steal_card: "抢夺卡",
  turtle_card: "乌龟卡",
  outlaw_card: "落草为寇",
  god_bless: "请神术",
  banish_god: "送神术",
  auction_card: "拍卖卡",
  build_card: "建筑卡",
  equal_poor_card: "均贫卡",
  equal_rich_card: "均富卡",
  nanman_card: "南蛮入侵",
  frame_card: "陷害卡"
};
const ITEM_SHOP_POOL: Array<{ itemId: ItemId; weight: number; price: number }> = [
  { itemId: "any_dice", weight: 16, price: 1800 },
  { itemId: "steal_card", weight: 10, price: 2600 },
  { itemId: "turtle_card", weight: 12, price: 2200 },
  { itemId: "outlaw_card", weight: 10, price: 2800 },
  { itemId: "god_bless", weight: 8, price: 3200 },
  { itemId: "banish_god", weight: 8, price: 2200 },
  { itemId: "auction_card", weight: 8, price: 2600 },
  { itemId: "build_card", weight: 10, price: 2400 },
  { itemId: "equal_poor_card", weight: 6, price: 3000 },
  { itemId: "equal_rich_card", weight: 6, price: 3200 },
  { itemId: "nanman_card", weight: 4, price: 3800 },
  { itemId: "frame_card", weight: 8, price: 2600 }
];
const ITEM_RANDOM_POOL: ItemId[] = [
  "any_dice",
  "steal_card",
  "turtle_card",
  "outlaw_card",
  "god_bless",
  "banish_god",
  "auction_card",
  "build_card",
  "equal_poor_card",
  "equal_rich_card",
  "nanman_card",
  "frame_card"
];
const FATE_EVENT_POOL: Array<{ id: FateEventId; weight: number }> = [
  { id: "gain_cash", weight: 16 },
  { id: "lose_cash", weight: 12 },
  { id: "steal_from_all", weight: 8 },
  { id: "give_to_all", weight: 10 },
  { id: "sell_one_property", weight: 10 },
  { id: "god_bless", weight: 9 },
  { id: "gain_item", weight: 12 },
  { id: "lose_item", weight: 10 },
  { id: "nanman", weight: 5 },
  { id: "go_jail", weight: 5 },
  { id: "move_to_start", weight: 3 }
];

function randomId(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function createPendingActionId(roomId: RoomId): string {
  pendingActionSeq += 1;
  return `${roomId}-${pendingActionSeq}`;
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

function buildPlayer(playerId: PlayerId, nickname: string, playerToken: string, initialCash: number): Player {
  return {
    playerId,
    nickname,
    position: 0,
    cash: initialCash,
    connected: true,
    joinedAt: Date.now(),
    ready: false,
    selectedCharacterId: null,
    playerToken,
    status: "active",
    items: [
      { itemId: "any_dice", count: 3 },
      { itemId: "steal_card", count: 0 },
      { itemId: "turtle_card", count: 0 },
      { itemId: "outlaw_card", count: 0 },
      { itemId: "god_bless", count: 0 },
      { itemId: "banish_god", count: 0 },
      { itemId: "auction_card", count: 0 },
      { itemId: "build_card", count: 0 },
      { itemId: "equal_poor_card", count: 0 },
      { itemId: "equal_rich_card", count: 0 },
      { itemId: "nanman_card", count: 0 },
      { itemId: "frame_card", count: 0 }
    ],
    effects: {
      turtleTurns: 0,
      outlawActive: false,
      godId: null,
      godTurns: 0,
      jailTurns: 0
    }
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

function clearPendingAction(record: RoomRecord): void {
  if (record.pendingActionTimeout) {
    clearTimeout(record.pendingActionTimeout);
    record.pendingActionTimeout = null;
  }
  record.state.pendingAction = null;
  record.state.pendingBuyTileIndex = null;
}

function destroyRoom(roomId: RoomId, reason: string): void {
  const record = rooms.get(roomId);
  if (!record) {
    return;
  }
  clearPendingAction(record);
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
  pendingTradeByRoom.delete(roomId);
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
  return Array.from({ length: BOARD_TILE_COUNT }, (_unused, index) => {
    const config = getTileConfig(index);
    return {
      index,
      ownerPlayerId: null,
      ownerCharacterId: null,
      price: config.price,
      rent: config.rentByLevel[0] ?? config.rent,
      level: 0
    };
  });
}

export function createRoom(socketId: string, nickname: string, playerToken: string): RoomState {
  const player = buildPlayer(randomPlayerId(), nickname, playerToken, MIN_INITIAL_CASH);
  const roomId = generateUniqueRoomId();

  const state: RoomState = {
    roomId,
    status: "waiting",
    players: [player],
    hostPlayerId: player.playerId,
    initialCash: MIN_INITIAL_CASH,
    currentTurnPlayerId: player.playerId,
    phase: "waiting",
    board: createBoard(),
    spectators: [],
    pendingBuyTileIndex: null,
    pendingAction: null,
    turnSeq: 0,
    lastRoll: null
  };

  rooms.set(roomId, { state, lastActivityAt: Date.now(), pendingActionTimeout: null });
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

  const player = buildPlayer(randomPlayerId(), nickname, playerToken, record.state.initialCash);
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

export function getRoomState(roomId: RoomId): RoomState | null {
  return rooms.get(roomId)?.state ?? null;
}

export function consumePendingTimeoutQueue(): Array<{
  roomId: RoomId;
  events: string[];
  announcements?: GameItemAnnouncementPayload[];
}> {
  if (pendingTimeoutQueue.length === 0) {
    return [];
  }
  return pendingTimeoutQueue.splice(0, pendingTimeoutQueue.length);
}

export function getSocketIdByRoomPlayer(roomId: RoomId, playerId: PlayerId): string | null {
  const key = roomPlayerKey(roomId, playerId);
  return playerToSocket.get(key) ?? null;
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
  if (record.state.pendingAction && record.state.pendingAction.targetPlayerToken === player.playerToken) {
    clearPendingAction(record);
  }
  const pendingTrade = pendingTradeByRoom.get(playerRef.roomId);
  if (pendingTrade && (pendingTrade.fromPlayerId === player.playerId || pendingTrade.toPlayerId === player.playerId)) {
    pendingTradeByRoom.delete(playerRef.roomId);
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
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return d1 + d2;
}

function randomGod(): GodId {
  return GOD_POOL[Math.floor(Math.random() * GOD_POOL.length)] ?? "land_god";
}

function getGodName(godId: GodId): string {
  return GOD_NAME_MAP[godId] ?? "神明";
}

function getJailTileIndex(): number {
  for (let i = 0; i < BOARD_TILE_COUNT; i += 1) {
    if (getTileConfig(i).tileId === "jail") {
      return i;
    }
  }
  return 0;
}

function tickGodTurnEffects(
  state: RoomState,
  events: string[] = [],
  announcements: GameItemAnnouncementPayload[] = []
): void {
  const currentId = state.currentTurnPlayerId;
  if (!currentId) {
    return;
  }
  const current = state.players.find((player) => player.playerId === currentId);
  if (!current || !current.effects.godId || current.effects.godTurns <= 0) {
    return;
  }
  current.effects.godTurns = Math.max(0, current.effects.godTurns - 1);
  if (current.effects.godTurns > 0) {
    return;
  }
  const expiredGod = current.effects.godId;
  current.effects.godId = null;
  const roleName = getRoleName(current);
  const text = `【公告】${roleName} 身上的「${getGodName(expiredGod)}」效果已到期`;
  events.push(text);
  announcements.push({
    roomId: state.roomId,
    title: "神明离体",
    text: `【${roleName}】的「${getGodName(expiredGod)}」已到期`
  });
}

function advanceTurn(state: RoomState): void {
  const expiryEvents: string[] = [];
  const expiryAnnouncements: GameItemAnnouncementPayload[] = [];
  tickGodTurnEffects(state, expiryEvents, expiryAnnouncements);
  if (expiryEvents.length > 0 || expiryAnnouncements.length > 0) {
    pendingTimeoutQueue.push({
      roomId: state.roomId,
      events: expiryEvents,
      announcements: expiryAnnouncements
    });
  }
  const connectedPlayers = state.players.filter((player) => player.connected);
  state.turnSeq += 1;
  if (connectedPlayers.length < 2) {
    state.currentTurnPlayerId = connectedPlayers[0]?.playerId ?? null;
    state.phase = "waiting";
    state.pendingBuyTileIndex = null;
    state.pendingAction = null;
    return;
  }
  const currentId = state.currentTurnPlayerId;
  if (!currentId) {
    state.currentTurnPlayerId = state.players[0].playerId;
    state.phase = "rolling";
    state.pendingBuyTileIndex = null;
    state.pendingAction = null;
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
  state.pendingAction = null;
  for (let guard = 0; guard < state.players.length; guard += 1) {
    const current = state.players.find((player) => player.playerId === state.currentTurnPlayerId);
    if (!current || !current.connected) {
      break;
    }
    if (current.effects.jailTurns <= 0) {
      break;
    }
    current.effects.jailTurns = Math.max(0, current.effects.jailTurns - 1);
    const roleName = getRoleName(current);
    const text = `【公告】${roleName} 在牢狱中，跳过本回合（剩余 ${current.effects.jailTurns} 回合）`;
    pendingTimeoutQueue.push({
      roomId: state.roomId,
      events: [text],
      announcements: [
        {
          roomId: state.roomId,
          title: "牢狱效果",
          text: `【${roleName}】本回合无法行动`
        }
      ]
    });
    const currentIndex = state.players.findIndex((player) => player.playerId === current.playerId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextIndex];
    if (nextPlayer?.connected) {
      state.currentTurnPlayerId = nextPlayer.playerId;
    } else {
      const fallback = state.players.find((player) => player.connected) ?? null;
      state.currentTurnPlayerId = fallback?.playerId ?? null;
    }
  }
}

function getCurrentPlayer(state: RoomState, playerId: PlayerId): Player | null {
  return state.players.find((player) => player.playerId === playerId) ?? null;
}

function getRoleName(player: Player | null | undefined): string {
  if (!player) {
    return "某玩家";
  }
  if (player.selectedCharacterId) {
    return CHARACTER_NAME_MAP[player.selectedCharacterId] ?? player.selectedCharacterId;
  }
  return player.nickname || "某玩家";
}

function getPlayerById(state: RoomState, playerId: string): Player | null {
  return state.players.find((item) => item.playerId === playerId) ?? null;
}

function normalizeTradeIndexes(input: number[], boardLength: number): number[] {
  const set = new Set<number>();
  input.forEach((value) => {
    const n = Math.floor(value);
    if (Number.isFinite(n) && n >= 0 && n < boardLength) {
      set.add(n);
    }
  });
  return Array.from(set.values());
}

function getUpgradeCost(tile: Tile): number {
  return getTileConfig(tile.index).upgradeCost || Math.max(120, Math.floor(tile.price * 0.55));
}

function getItemCount(player: Player, itemId: ItemId): number {
  return player.items.find((item) => item.itemId === itemId)?.count ?? 0;
}

function addItem(player: Player, itemId: ItemId, amount = 1): void {
  if (amount <= 0) {
    return;
  }
  const item = player.items.find((entry) => entry.itemId === itemId);
  if (item) {
    item.count += amount;
    return;
  }
  player.items.push({ itemId, count: amount });
}

function consumeItem(player: Player, itemId: ItemId): boolean {
  const item = player.items.find((entry) => entry.itemId === itemId);
  if (!item || item.count <= 0) {
    return false;
  }
  item.count -= 1;
  return true;
}

function normalizeDice(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const n = Math.floor(value);
  if (n < 1 || n > 6) {
    return null;
  }
  return n;
}

function getItemEffectDescription(itemId: ItemId): string {
  return ITEM_EFFECT_DESC_MAP[itemId] ?? "未知道具效果。";
}

function getItemDisplayName(itemId: ItemId): string {
  return ITEM_NAME_MAP[itemId] ?? itemId;
}

function rollItemShopOffer(): ItemShopOffer {
  const total = ITEM_SHOP_POOL.reduce((sum, item) => sum + item.weight, 0);
  let ticket = Math.random() * total;
  for (const entry of ITEM_SHOP_POOL) {
    ticket -= entry.weight;
    if (ticket <= 0) {
      return {
        itemId: entry.itemId,
        price: entry.price,
        description: getItemEffectDescription(entry.itemId)
      };
    }
  }
  const fallback = ITEM_SHOP_POOL[0]!;
  return {
    itemId: fallback.itemId,
    price: fallback.price,
    description: getItemEffectDescription(fallback.itemId)
  };
}

function rollFateEventId(): FateEventId {
  const total = FATE_EVENT_POOL.reduce((sum, item) => sum + item.weight, 0);
  let ticket = Math.random() * total;
  for (const entry of FATE_EVENT_POOL) {
    ticket -= entry.weight;
    if (ticket <= 0) {
      return entry.id;
    }
  }
  return FATE_EVENT_POOL[0]!.id;
}

function rollFateEvent(
  record: RoomRecord,
  player: Player,
  events: string[],
  announcements: GameItemAnnouncementPayload[]
): void {
  const state = record.state;
  const roleName = getRoleName(player);
  const fate = rollFateEventId();
  if (fate === "gain_cash") {
    const amount = randomDice() * 1000;
    player.cash += amount;
    events.push(`【命运】${roleName} 鸿运当头，获得 ${amount} 金`);
    return;
  }
  if (fate === "lose_cash") {
    const amount = randomDice() * 1000;
    player.cash -= amount;
    events.push(`【命运】${roleName} 祸从天降，失去 ${amount} 金`);
    return;
  }
  if (fate === "steal_from_all") {
    const targets = state.players.filter((item) => item.status === "active" && item.playerId !== player.playerId);
    let total = 0;
    const detail: string[] = [];
    targets.forEach((target) => {
      const amount = randomDice() * 300;
      target.cash -= amount;
      player.cash += amount;
      total += amount;
      detail.push(`${getRoleName(target)}-${amount}`);
    });
    events.push(`【命运】${roleName} 向全场收取贡金，共 ${total} 金（${detail.join("，")}）`);
    return;
  }
  if (fate === "give_to_all") {
    const targets = state.players.filter((item) => item.status === "active");
    const detail: string[] = [];
    targets.forEach((target) => {
      const amount = randomDice() * 300;
      target.cash += amount;
      detail.push(`${getRoleName(target)}+${amount}`);
    });
    events.push(`【命运】天降福泽，全员获得随机金钱（${detail.join("，")}）`);
    return;
  }
  if (fate === "sell_one_property") {
    const ownTiles = state.board.filter((tile) => tile.ownerPlayerId === player.playerId);
    if (ownTiles.length === 0) {
      events.push(`【命运】${roleName} 无地产可变卖，本次命运无事发生`);
      return;
    }
    const tile = ownTiles[Math.floor(Math.random() * ownTiles.length)]!;
    const cfg = getTileConfig(tile.index);
    tile.ownerPlayerId = null;
    tile.ownerCharacterId = null;
    tile.level = 0;
    tile.rent = cfg.rentByLevel[0] ?? cfg.rent;
    events.push(`【命运】${roleName} 被迫变卖「${getTileDisplayName(state.roomId, tile.index)}」`);
    return;
  }
  if (fate === "god_bless") {
    const godId = randomGod();
    const godName = getGodName(godId);
    player.effects.godId = godId;
    player.effects.godTurns = GOD_DURATION_TURNS;
    const delta = randomDice() * 1000;
    if (godId === "fortune_god") {
      player.cash += delta;
      events.push(`【命运】${roleName} 请来${godName}，额外获得 ${delta} 金`);
    } else if (godId === "poor_god") {
      player.cash -= delta;
      events.push(`【命运】${roleName} 请来${godName}，额外失去 ${delta} 金`);
    } else {
      events.push(`【命运】${roleName} 请来${godName}上身（${GOD_DURATION_TURNS}回合）`);
    }
    announcements.push({
      roomId: state.roomId,
      title: "命运请神",
      text: `【${roleName}】触发命运，请来「${godName}」`
    });
    return;
  }
  if (fate === "gain_item") {
    const itemId = ITEM_RANDOM_POOL[Math.floor(Math.random() * ITEM_RANDOM_POOL.length)]!;
    addItem(player, itemId, 1);
    events.push(`【命运】${roleName} 获得道具「${getItemDisplayName(itemId)}」`);
    return;
  }
  if (fate === "lose_item") {
    const pool = player.items.filter((item) => item.count > 0);
    if (pool.length === 0) {
      events.push(`【命运】${roleName} 没有可失去的道具`);
      return;
    }
    const lost = pool[Math.floor(Math.random() * pool.length)]!;
    consumeItem(player, lost.itemId);
    events.push(`【命运】${roleName} 失去道具「${getItemDisplayName(lost.itemId)}」`);
    return;
  }
  if (fate === "nanman") {
    const detail: string[] = [];
    state.players.forEach((target) => {
      if (target.status !== "active") {
        return;
      }
      const propertyCount = state.board.filter((tile) => tile.ownerPlayerId === target.playerId).length;
      const damage = propertyCount * 100;
      target.cash -= damage;
      detail.push(`${getRoleName(target)}-${damage}`);
    });
    events.push(`【命运】全场南蛮入侵：${detail.join("，")}`);
    return;
  }
  if (fate === "go_jail") {
    player.position = getJailTileIndex();
    player.effects.jailTurns = 3;
    events.push(`【命运】${roleName} 被投入牢狱，3 回合无法行动`);
    announcements.push({
      roomId: state.roomId,
      title: "命运惩罚",
      text: `【${roleName}】进入牢狱（3回合）`
    });
    return;
  }
  player.position = 0;
  player.cash += 2000;
  events.push(`【命运】${roleName} 被传送到起点，并触发起点奖励 +2000`);
}

function circularDistance(a: number, b: number, mod: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, mod - diff);
}

function settleBankruptcyAndVictory(
  record: RoomRecord,
  events: string[],
  announcements: GameItemAnnouncementPayload[]
): void {
  const state = record.state;
  const bankruptPlayers = state.players.filter((player) => player.status === "active" && player.cash < 0);
  bankruptPlayers.forEach((player) => {
    state.board.forEach((tile) => {
      if (tile.ownerPlayerId !== player.playerId) {
        return;
      }
      const cfg = getTileConfig(tile.index);
      tile.ownerPlayerId = null;
      tile.ownerCharacterId = null;
      tile.level = 0;
      tile.rent = cfg.rentByLevel[0] ?? cfg.rent;
    });
    player.cash = 0;
    player.status = "left";
    player.connected = false;
    player.effects.outlawActive = false;
    player.effects.turtleTurns = 0;
    player.effects.godId = null;
    player.effects.godTurns = 0;
    player.effects.jailTurns = 0;
    const socketKey = roomPlayerKey(state.roomId, player.playerId);
    const socketId = playerToSocket.get(socketKey);
    if (socketId) {
      socketToPlayer.delete(socketId);
      playerToSocket.delete(socketKey);
    }
    const pendingTrade = pendingTradeByRoom.get(state.roomId);
    if (pendingTrade && (pendingTrade.fromPlayerId === player.playerId || pendingTrade.toPlayerId === player.playerId)) {
      pendingTradeByRoom.delete(state.roomId);
    }
    events.push(`【公告】${getRoleName(player)} 资金为负，宣告破产，名下地产已全部清空`);
    announcements.push({
      roomId: state.roomId,
      title: "玩家破产",
      text: `【${getRoleName(player)}】已破产并退出结算`
    });
  });
  if (state.status !== "in_game") {
    return;
  }
  const alivePlayers = state.players.filter((player) => player.status === "active");
  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0]!;
    state.status = "ended";
    state.phase = "waiting";
    state.currentTurnPlayerId = winner.playerId;
    clearPendingAction(record);
    events.push(`【公告】${getRoleName(winner)} 成为最后幸存者，获得胜利！`);
    announcements.push({
      roomId: state.roomId,
      title: "游戏结束",
      text: `【${getRoleName(winner)}】获得胜利！`
    });
  }
}

function applyPendingDecision(
  record: RoomRecord,
  player: Player,
  decision: DecisionType,
  reason: "manual" | "timeout"
): { ok: boolean; events: string[]; action: TradeActionSuccessPayload["action"] } {
  const pending = record.state.pendingAction;
  if (!pending) {
    return { ok: false, events: [], action: "skip_buy" };
  }
  const tile = record.state.board[pending.tileIndex];
  if (!tile) {
    return { ok: false, events: [], action: "skip_buy" };
  }
  const roleName = getRoleName(player);
  const tileName = getTileDisplayName(record.state.roomId, tile.index);
  const events: string[] = [];

  if (pending.type === "BUY") {
    if (decision === "BUY_CONFIRM") {
      if (!tile.ownerPlayerId && player.cash >= tile.price) {
        player.cash -= tile.price;
        tile.ownerPlayerId = player.playerId;
        tile.ownerCharacterId = player.selectedCharacterId;
        events.push(`【${roleName}】购买了「${tileName}」(-${tile.price})`);
      } else if (player.cash < tile.price) {
        events.push(`【${roleName}】资金不足，无法购买「${tileName}」`);
      } else {
        events.push(`【${roleName}】放弃购买「${tileName}」`);
      }
      return { ok: true, events, action: "buy" };
    }
    const timeoutSuffix = reason === "timeout" ? "（超时）" : "";
    events.push(`【${roleName}】放弃购买「${tileName}」${timeoutSuffix}`);
    return { ok: true, events, action: "skip_buy" };
  }

  if (decision === "UPGRADE_CONFIRM") {
    const cost = getUpgradeCost(tile);
    const cfg = getTileConfig(tile.index);
    const maxLevel = Math.max(0, (cfg.rentByLevel?.length ?? 1) - 1);
    if (tile.level >= maxLevel) {
      events.push(`【${roleName}】的「${tileName}」已满级，无需升级`);
      return { ok: true, events, action: "skip_upgrade" };
    }
    if (player.cash >= cost) {
      const prevLevel = tile.level;
      const nextLevel = Math.min(prevLevel + 1, maxLevel);
      player.cash -= cost;
      tile.level = nextLevel;
      tile.rent = cfg.rentByLevel[nextLevel] ?? tile.rent;
      events.push(`【${roleName}】将「${tileName}」升级至 Lv.${nextLevel}（-${cost}，过路费 ${tile.rent}）`);
    } else {
      events.push(`【${roleName}】资金不足，无法升级「${tileName}」`);
      return { ok: true, events, action: "skip_upgrade" };
    }
    return { ok: true, events, action: "upgrade" };
  }
  if (pending.type === "ITEM_SHOP") {
    const offerItemId = pending.shopOfferItemId;
    const offerPrice = pending.shopOfferPrice ?? 0;
    if (!offerItemId || offerPrice <= 0) {
      return { ok: true, events: [`【${roleName}】道具店货架已失效`], action: "shop_skip" };
    }
    if (decision === "SHOP_CONFIRM") {
      if (player.cash < offerPrice) {
        events.push(`【${roleName}】资金不足，无法购买道具（${offerPrice} 金）`);
        return { ok: true, events, action: "shop_skip" };
      }
      player.cash -= offerPrice;
      addItem(player, offerItemId, 1);
      events.push(`【${roleName}】在道具店购买「${getItemDisplayName(offerItemId)}」(-${offerPrice})`);
      return { ok: true, events, action: "shop_buy" };
    }
    const timeoutSuffix = reason === "timeout" ? "（超时）" : "";
    events.push(`【${roleName}】放弃购买道具${timeoutSuffix}`);
    return { ok: true, events, action: "shop_skip" };
  }
  const timeoutSuffix = reason === "timeout" ? "（超时）" : "";
  events.push(`【${roleName}】放弃升级「${tileName}」${timeoutSuffix}`);
  return { ok: true, events, action: "skip_upgrade" };
}

function createPendingAction(
  record: RoomRecord,
  player: Player,
  type: PendingActionType,
  tileIndex: number,
  shopOffer?: ItemShopOffer
): void {
  clearPendingAction(record);
  const now = Date.now();
  const actionId = createPendingActionId(record.state.roomId);
  record.state.pendingAction = {
    id: actionId,
    type,
    tileIndex,
    targetPlayerToken: player.playerToken,
    shopOfferItemId: shopOffer?.itemId,
    shopOfferPrice: shopOffer?.price,
    shopOfferDetail: shopOffer?.description,
    createdAt: now,
    expiresAt: now + PENDING_ACTION_TIMEOUT_MS
  };
  record.state.pendingBuyTileIndex = type === "BUY" ? tileIndex : null;
  record.state.phase = "can_buy";
  record.pendingActionTimeout = setTimeout(() => {
    const liveRecord = rooms.get(record.state.roomId);
    if (!liveRecord || !liveRecord.state.pendingAction || liveRecord.state.pendingAction.id !== actionId) {
      return;
    }
    const livePlayer = liveRecord.state.players.find((item) => item.playerToken === player.playerToken);
    if (!livePlayer) {
      clearPendingAction(liveRecord);
      advanceTurn(liveRecord.state);
      touchRoom(liveRecord);
      return;
    }
    const fallbackDecision: DecisionType =
      type === "BUY" ? "BUY_SKIP" : type === "UPGRADE" ? "UPGRADE_SKIP" : "SHOP_SKIP";
    const decision = applyPendingDecision(liveRecord, livePlayer, fallbackDecision, "timeout");
    clearPendingAction(liveRecord);
    advanceTurn(liveRecord.state);
    touchRoom(liveRecord);
    pendingTimeoutQueue.push({
      roomId: liveRecord.state.roomId,
      events: decision.events
    });
  }, PENDING_ACTION_TIMEOUT_MS);
}

export function rollRequest(socketId: string, roomId: RoomId, forcedDice?: number): RollResult {
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

  const player = record.state.players[currentPlayerIndex];
  const events: string[] = [];
  const announcements: GameItemAnnouncementPayload[] = [];
  const roleName = getRoleName(player);
  const prevPosition = player.position;
  const forced = normalizeDice(forcedDice);
  let dice = forced ?? randomDice();
  if (player.effects.turtleTurns > 0) {
    dice = 1;
    player.effects.turtleTurns = Math.max(0, player.effects.turtleTurns - 1);
    events.push(`【${roleName}】受乌龟卡影响，本回合掷出 1 点（剩余 ${player.effects.turtleTurns} 回合）`);
  }
  const nextPosition = (prevPosition + dice) % BOARD_TILE_COUNT;
  const passedOrLandedStart = nextPosition < prevPosition || nextPosition === 0;
  if (passedOrLandedStart) {
    player.cash += 2000;
    events.push(`【${roleName}】经过/到达起点，获得 2000 金`);
  }

  record.state.phase = "moving";
  player.position = nextPosition;
  record.state.lastRoll = {
    playerId: player.playerId,
    value: dice
  };
  record.state.pendingBuyTileIndex = null;

  const landedTile = record.state.board[nextPosition];
  const landedConfig = getTileConfig(nextPosition);
  const tileName = getTileDisplayName(roomId, nextPosition);
  const activeGod = player.effects.godId;
  let landing: GameLandingResolvedPayload = {
    roomId,
    playerId: player.playerId,
    heroId: player.selectedCharacterId,
    tileId: nextPosition,
    tileType: "special",
    action: "NOOP"
  };
  if (player.effects.outlawActive) {
    let target: Player | undefined;
    for (let step = 1; step <= dice; step += 1) {
      const stepPosition = (prevPosition + step) % BOARD_TILE_COUNT;
      target = record.state.players.find(
        (item) => item.playerId !== player.playerId && item.status === "active" && item.position === stepPosition
      );
      if (target) {
        break;
      }
    }
    if (target) {
      const amount = Math.max(1, Math.floor(target.cash * 0.15));
      const transfer = Math.min(amount, target.cash);
      target.cash -= transfer;
      player.cash += transfer;
      player.effects.outlawActive = false;
      events.push(`【公告】${roleName} 落草为寇，抢走【${getRoleName(target)}】${transfer} 金`);
      announcements.push({
        roomId,
        title: "落草为寇触发",
        text: `【${roleName}】遭遇【${getRoleName(target)}】，抢走 ${transfer} 金`
      });
    }
  }
  if (landedConfig.kind === "property" && activeGod === "holy_mary") {
    landedTile.ownerPlayerId = null;
    landedTile.ownerCharacterId = null;
    landedTile.level = 0;
    landedTile.rent = landedConfig.rentByLevel[0] ?? landedConfig.rent;
    events.push(`【${roleName}】受圣母玛丽亚庇护，净化了「${tileName}」`);
  } else if (landedConfig.kind === "property" && activeGod === "land_god") {
    landedTile.ownerPlayerId = player.playerId;
    landedTile.ownerCharacterId = player.selectedCharacterId;
    events.push(`【${roleName}】受土地神庇护，占领了「${tileName}」`);
  }
  const specialHook = checkTileSpecialHook(roomId, nextPosition, player.selectedCharacterId, record.state);
  if (specialHook.handled) {
    landing = {
      ...landing,
      tileType: landedConfig.kind,
      action: "SPECIAL_TRIGGER"
    };
    if (specialHook.message) {
      events.push(specialHook.message);
    } else {
      events.push(`【${roleName}】触发「${tileName}」`);
    }
    advanceTurn(record.state);
    settleBankruptcyAndVictory(record, events, announcements);
    touchRoom(record);
    return {
      ok: true,
      state: record.state,
      landing,
      events,
      announcements,
      result: {
        ok: true,
        roomId,
        playerId: player.playerId,
        dice,
        position: nextPosition
      }
    };
  }
  if (landedConfig.kind === "special" && landedConfig.tileId === "fate") {
    rollFateEvent(record, player, events, announcements);
    landing = {
      ...landing,
      action: "SPECIAL_TRIGGER",
      detail: "触发命运事件"
    };
    advanceTurn(record.state);
    settleBankruptcyAndVictory(record, events, announcements);
    touchRoom(record);
    return {
      ok: true,
      state: record.state,
      landing,
      events,
      announcements,
      result: {
        ok: true,
        roomId,
        playerId: player.playerId,
        dice,
        position: player.position
      }
    };
  }
  if (landedConfig.kind === "special" && landedConfig.tileId === "item_shop") {
    const offer = rollItemShopOffer();
    createPendingAction(record, player, "ITEM_SHOP", landedTile.index, offer);
    landing = {
      ...landing,
      action: "ITEM_SHOP_OFFER",
      amount: offer.price,
      itemId: offer.itemId,
      detail: offer.description
    };
    touchRoom(record);
    return {
      ok: true,
      state: record.state,
      landing,
      events: [...events, `【${roleName}】来到道具店，刷新出「${getItemDisplayName(offer.itemId)}」（${offer.price} 金）`],
      announcements,
      result: {
        ok: true,
        roomId,
        playerId: player.playerId,
        dice,
        position: nextPosition
      }
    };
  }
  landing = {
    ...landing,
    tileType: landedConfig.kind
  };
  if (landedConfig.kind === "property") {
    if (!landedTile.ownerPlayerId) {
      if (player.cash < landedTile.price) {
        events.push(`【${roleName}】资金不足，无法购买「${tileName}」`);
        landing = {
          ...landing,
          action: "NOOP"
        };
        advanceTurn(record.state);
      } else {
        createPendingAction(record, player, "BUY", landedTile.index);
        landing = {
          ...landing,
          action: "BUY_OFFER",
          amount: landedTile.price
        };
      }
    } else if (landedTile.ownerPlayerId && landedTile.ownerPlayerId !== player.playerId) {
      const owner = getCurrentPlayer(record.state, landedTile.ownerPlayerId);
      if (owner) {
        const landedTileCfg = getTileConfig(landedTile.index);
        const targetZhou = landedTileCfg.zhouAbbr;
        const sameZhouOwnerTiles = record.state.board.filter((tile) => {
          if (tile.ownerPlayerId !== owner.playerId) {
            return false;
          }
          const cfg = getTileConfig(tile.index);
          return cfg.kind === "property" && cfg.zhouAbbr && cfg.zhouAbbr === targetZhou;
        });
        const rentScopeTiles = sameZhouOwnerTiles.length > 0 ? sameZhouOwnerTiles : [landedTile];
        const baseRentTotal = rentScopeTiles.reduce((sum, tile) => {
          const cfg = getTileConfig(tile.index);
          const tileRent = cfg.rentByLevel[tile.level] ?? tile.rent;
          tile.rent = tileRent;
          return sum + tileRent;
        }, 0);
        let payment = baseRentTotal;
        if (activeGod === "fortune_god") {
          payment = 0;
        } else if (activeGod === "poor_god") {
          payment = baseRentTotal * 2;
        }
        player.cash -= payment;
        owner.cash += payment;
        const zhouLabel = landedTileCfg.zhouName ?? landedTileCfg.zhouAbbr ?? "本州";
        const tileNames = rentScopeTiles.map((tile) => getTileDisplayName(roomId, tile.index)).join("、");
        if (activeGod === "fortune_god") {
          events.push(`【${roleName}】受财神庇护，免除【${getRoleName(owner)}】「${zhouLabel}」全州过路费（${tileNames}）`);
        } else if (activeGod === "poor_god") {
          events.push(`【${roleName}】受穷神影响，向【${getRoleName(owner)}】支付「${zhouLabel}」全州双倍过路费（${tileNames}）(-${payment})`);
        } else {
          events.push(`【${roleName}】向【${getRoleName(owner)}】支付「${zhouLabel}」全州过路费（${tileNames}）(-${payment})`);
        }
        if (activeGod === "liu_dehua") {
          const robbed = Math.min(1000, owner.cash);
          owner.cash -= robbed;
          player.cash += robbed;
          events.push(`【${roleName}】触发刘德华神力，从【${getRoleName(owner)}】处抢走 ${robbed} 金`);
        }
        landing = {
          ...landing,
          action: "PAY_RENT",
          amount: payment,
          ownerHeroId: owner.selectedCharacterId
        };
      }
      // after rent settlement, advance turn immediately
      advanceTurn(record.state);
    } else {
      const upgradeCost = getUpgradeCost(landedTile);
      if (player.cash < upgradeCost) {
        events.push(`【${roleName}】资金不足，无法升级「${tileName}」`);
        landing = {
          ...landing,
          action: "NOOP"
        };
        advanceTurn(record.state);
      } else {
        createPendingAction(record, player, "UPGRADE", landedTile.index);
        landing = {
          ...landing,
          action: "UPGRADE_OFFER",
          amount: upgradeCost
        };
      }
    }
  } else {
    // start/safe tile, no buy flow
    landing = {
      ...landing,
      action: "SPECIAL_TRIGGER"
    };
    events.push(`${roleName} 触发「${tileName}」`);
    advanceTurn(record.state);
  }
  touchRoom(record);
  settleBankruptcyAndVictory(record, events, announcements);

  return {
    ok: true,
    state: record.state,
    landing,
    events,
    announcements,
    result: {
      ok: true,
      roomId,
      playerId: player.playerId,
      dice,
      position: nextPosition
    }
  };
}

function validateTradeRequest(
  socketId: string,
  roomId: RoomId
): { state?: RoomState; player?: Player; record?: RoomRecord; code?: TradeFailureCode } {
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
  if (!record.state.pendingAction) {
    return { code: "NOT_BUY_PHASE" };
  }
  const player = getCurrentPlayer(record.state, playerRef.playerId);
  if (!player) {
    return { code: "ROOM_NOT_FOUND" };
  }
  return { state: record.state, player, record };
}

export function buyRequest(socketId: string, roomId: RoomId): TradeResult {
  const validation = validateTradeRequest(socketId, roomId);
  if (!validation.state || !validation.player || !validation.record) {
    return { ok: false, code: validation.code ?? "ROOM_NOT_FOUND" };
  }
  const pending = validation.state.pendingAction;
  if (!pending || pending.type !== "BUY" || pending.targetPlayerToken !== validation.player.playerToken) {
    return { ok: false, code: "NOT_BUY_PHASE" };
  }
  const decision = applyPendingDecision(validation.record, validation.player, "BUY_CONFIRM", "manual");
  clearPendingAction(validation.record);
  advanceTurn(validation.state);
  touchRoom(validation.record);

  return {
    ok: true,
    state: validation.state,
    events: decision.events,
    result: {
      ok: true,
      roomId,
      playerId: validation.player.playerId,
      action: decision.action
    }
  };
}

export function skipBuy(socketId: string, roomId: RoomId): TradeResult {
  const validation = validateTradeRequest(socketId, roomId);
  if (!validation.state || !validation.player || !validation.record) {
    return { ok: false, code: validation.code ?? "ROOM_NOT_FOUND" };
  }
  const pending = validation.state.pendingAction;
  if (!pending || pending.targetPlayerToken !== validation.player.playerToken) {
    return { ok: false, code: "NOT_BUY_PHASE" };
  }
  const fallbackDecision: DecisionType =
    pending.type === "BUY" ? "BUY_SKIP" : pending.type === "UPGRADE" ? "UPGRADE_SKIP" : "SHOP_SKIP";
  const decision = applyPendingDecision(validation.record, validation.player, fallbackDecision, "manual");
  clearPendingAction(validation.record);
  advanceTurn(validation.state);
  touchRoom(validation.record);
  return {
    ok: true,
    state: validation.state,
    events: decision.events,
    result: {
      ok: true,
      roomId,
      playerId: validation.player.playerId,
      action: decision.action
    }
  };
}

export function actionDecision(
  socketId: string,
  roomId: RoomId,
  actionId: string,
  playerToken: string,
  turnSeq: number,
  decision: DecisionType
): TradeResult {
  const validation = validateTradeRequest(socketId, roomId);
  if (!validation.state || !validation.player || !validation.record) {
    return { ok: false, code: validation.code ?? "ROOM_NOT_FOUND" };
  }
  const pending = validation.state.pendingAction;
  if (!pending) {
    return { ok: false, code: "NOT_BUY_PHASE" };
  }
  if (
    pending.id !== actionId ||
    pending.targetPlayerToken !== playerToken.trim() ||
    validation.player.playerToken !== pending.targetPlayerToken ||
    validation.state.turnSeq !== turnSeq
  ) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (
    (pending.type === "BUY" && !(decision === "BUY_CONFIRM" || decision === "BUY_SKIP")) ||
    (pending.type === "UPGRADE" && !(decision === "UPGRADE_CONFIRM" || decision === "UPGRADE_SKIP")) ||
    (pending.type === "ITEM_SHOP" && !(decision === "SHOP_CONFIRM" || decision === "SHOP_SKIP"))
  ) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const applied = applyPendingDecision(validation.record, validation.player, decision, "manual");
  clearPendingAction(validation.record);
  advanceTurn(validation.state);
  touchRoom(validation.record);
  return {
    ok: true,
    state: validation.state,
    events: applied.events,
    result: {
      ok: true,
      roomId,
      playerId: validation.player.playerId,
      action: applied.action
    }
  };
}

export function createTradeOffer(
  socketId: string,
  roomId: RoomId,
  targetPlayerId: string,
  givePropertyIndexes: number[],
  takePropertyIndexes: number[],
  giveCash: number,
  takeCash: number,
  giveItems: string[],
  takeItems: string[]
): TradeOfferResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  if (entry.state.status !== "in_game") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (entry.player.playerId === targetPlayerId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const targetPlayer = getPlayerById(entry.state, targetPlayerId);
  if (!targetPlayer || targetPlayer.status !== "active") {
    return { ok: false, code: "PLAYER_NOT_FOUND" };
  }
  const normalizedGiveCash = Math.max(0, Math.floor(giveCash));
  const normalizedTakeCash = Math.max(0, Math.floor(takeCash));
  if (entry.player.cash < normalizedGiveCash || targetPlayer.cash < normalizedTakeCash) {
    return { ok: false, code: "INSUFFICIENT_CASH" };
  }
  const normalizedGiveIndexes = normalizeTradeIndexes(givePropertyIndexes, entry.state.board.length);
  const normalizedTakeIndexes = normalizeTradeIndexes(takePropertyIndexes, entry.state.board.length);
  const giverOwnsAll = normalizedGiveIndexes.every((idx) => entry.state!.board[idx]?.ownerPlayerId === entry.player!.playerId);
  const targetOwnsAll = normalizedTakeIndexes.every((idx) => entry.state!.board[idx]?.ownerPlayerId === targetPlayer.playerId);
  if (!giverOwnsAll || !targetOwnsAll) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const tradeId = createPendingActionId(roomId);
  const offer: PendingTradeOffer = {
    tradeId,
    roomId,
    fromPlayerId: entry.player.playerId,
    toPlayerId: targetPlayer.playerId,
    givePropertyIndexes: normalizedGiveIndexes,
    takePropertyIndexes: normalizedTakeIndexes,
    giveCash: normalizedGiveCash,
    takeCash: normalizedTakeCash,
    giveItems: giveItems.slice(0, 8),
    takeItems: takeItems.slice(0, 8),
    createdAt: Date.now()
  };
  pendingTradeByRoom.set(roomId, offer);
  const record = rooms.get(roomId);
  if (record) {
    touchRoom(record);
  }
  return { ok: true, state: entry.state, offer };
}

export function respondTradeOffer(
  socketId: string,
  roomId: RoomId,
  tradeId: string,
  accept: boolean
): TradeOfferResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  const pending = pendingTradeByRoom.get(roomId);
  if (!pending || pending.tradeId !== tradeId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (pending.toPlayerId !== entry.player.playerId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const fromPlayer = getPlayerById(entry.state, pending.fromPlayerId);
  const toPlayer = getPlayerById(entry.state, pending.toPlayerId);
  if (!fromPlayer || !toPlayer) {
    pendingTradeByRoom.delete(roomId);
    return { ok: false, code: "PLAYER_NOT_FOUND" };
  }
  const events: string[] = [];
  const fromName = getRoleName(fromPlayer);
  const toName = getRoleName(toPlayer);
  if (!accept) {
    pendingTradeByRoom.delete(roomId);
    events.push(`【${toName}】拒绝了【${fromName}】发起的交易`);
    return { ok: true, state: entry.state, offer: pending, events };
  }
  if (fromPlayer.cash < pending.giveCash || toPlayer.cash < pending.takeCash) {
    pendingTradeByRoom.delete(roomId);
    return { ok: false, code: "INSUFFICIENT_CASH" };
  }
  const fromStillOwns = pending.givePropertyIndexes.every((idx) => entry.state!.board[idx]?.ownerPlayerId === fromPlayer.playerId);
  const toStillOwns = pending.takePropertyIndexes.every((idx) => entry.state!.board[idx]?.ownerPlayerId === toPlayer.playerId);
  if (!fromStillOwns || !toStillOwns) {
    pendingTradeByRoom.delete(roomId);
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  fromPlayer.cash = fromPlayer.cash - pending.giveCash + pending.takeCash;
  toPlayer.cash = toPlayer.cash - pending.takeCash + pending.giveCash;
  pending.givePropertyIndexes.forEach((idx) => {
    const tile = entry.state!.board[idx];
    if (!tile) {
      return;
    }
    tile.ownerPlayerId = toPlayer.playerId;
    tile.ownerCharacterId = toPlayer.selectedCharacterId;
  });
  pending.takePropertyIndexes.forEach((idx) => {
    const tile = entry.state!.board[idx];
    if (!tile) {
      return;
    }
    tile.ownerPlayerId = fromPlayer.playerId;
    tile.ownerCharacterId = fromPlayer.selectedCharacterId;
  });
  pendingTradeByRoom.delete(roomId);
  events.push(
    `【${toName}】同意了与【${fromName}】的交易（地产 ${pending.givePropertyIndexes.length}/${pending.takePropertyIndexes.length}，金额 ${pending.giveCash}/${pending.takeCash}）`
  );
  return { ok: true, state: entry.state, offer: pending, events };
}

export function getTradeOfferForRoom(roomId: RoomId): TradeOfferEventPayload | null {
  const pending = pendingTradeByRoom.get(roomId);
  if (!pending) {
    return null;
  }
  const state = rooms.get(roomId)?.state;
  if (!state) {
    return null;
  }
  const from = getPlayerById(state, pending.fromPlayerId);
  const to = getPlayerById(state, pending.toPlayerId);
  return {
    roomId,
    tradeId: pending.tradeId,
    fromPlayerId: pending.fromPlayerId,
    toPlayerId: pending.toPlayerId,
    fromHeroId: from?.selectedCharacterId ?? null,
    toHeroId: to?.selectedCharacterId ?? null,
    givePropertyIndexes: pending.givePropertyIndexes,
    takePropertyIndexes: pending.takePropertyIndexes,
    giveCash: pending.giveCash,
    takeCash: pending.takeCash,
    giveItems: pending.giveItems,
    takeItems: pending.takeItems,
    createdAt: pending.createdAt
  };
}

export function useItemRequest(
  socketId: string,
  roomId: RoomId,
  itemId: ItemId,
  targetPlayerId?: string,
  targetTileIndex?: number,
  desiredDice?: number
): UseItemResult {
  const entry = getPlayerRecord(socketId, roomId);
  if (!entry.state || !entry.player) {
    return { ok: false, code: entry.code ?? "ROOM_NOT_FOUND" };
  }
  const state = entry.state;
  const player = entry.player;
  if (state.status !== "in_game" || state.phase !== "rolling" || state.currentTurnPlayerId !== player.playerId) {
    return { ok: false, code: "NOT_YOUR_TURN" };
  }
  if (getItemCount(player, itemId) <= 0) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }

  const events: string[] = [];
  const announcements: GameItemAnnouncementPayload[] = [];
  const roleName = getRoleName(player);
  if (itemId === "any_dice") {
    const fixed = normalizeDice(desiredDice);
    if (!fixed) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    events.push(`【${roleName}】使用任意骰子，指定点数 ${fixed}`);
    const roll = rollRequest(socketId, roomId, fixed);
    if (!roll.ok || !roll.state || !roll.result) {
      addItem(player, itemId, 1);
      return { ok: false, code: roll.code ?? "ERR_INVALID_ACTION" };
    }
    return {
      ok: true,
      state: roll.state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      roll: roll.result,
      events: [...events, ...(roll.events ?? [])],
      announcements: [...announcements, ...(roll.announcements ?? [])]
    };
  }

  if (itemId === "god_bless") {
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const godId = randomGod();
    const godName = getGodName(godId);
    const existed = player.effects.godId ? getGodName(player.effects.godId) : null;
    player.effects.godId = godId;
    player.effects.godTurns = GOD_DURATION_TURNS;
    const delta = randomDice() * 1000;
    if (godId === "fortune_god") {
      player.cash += delta;
      events.push(`【公告】${roleName} 请神上身：${godName}，立即获得 ${delta} 金，持续 ${GOD_DURATION_TURNS} 回合`);
    } else if (godId === "poor_god") {
      player.cash -= delta;
      events.push(`【公告】${roleName} 请神上身：${godName}，立即失去 ${delta} 金，持续 ${GOD_DURATION_TURNS} 回合`);
    } else {
      events.push(`【公告】${roleName} 请神上身：${godName}，持续 ${GOD_DURATION_TURNS} 回合`);
    }
    announcements.push({
      roomId,
      title: "请神术发动",
      text: existed
        ? `【${roleName}】送走「${existed}」，请来了「${godName}」`
        : `【${roleName}】请来了「${godName}」上身（${GOD_DURATION_TURNS}回合）`
    });
    const record = rooms.get(roomId);
    if (record) {
      settleBankruptcyAndVictory(record, events, announcements);
    }
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "banish_god") {
    if (!targetPlayerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const target = getPlayerById(state, targetPlayerId);
    if (!target || target.status !== "active") {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const distance = circularDistance(player.position, target.position, state.board.length);
    if (target.playerId !== player.playerId && distance > 4) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!target.effects.godId || target.effects.godTurns <= 0) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const removedGod = getGodName(target.effects.godId);
    target.effects.godId = null;
    target.effects.godTurns = 0;
    events.push(`【公告】${roleName} 对【${getRoleName(target)}】使用送神术，送走了「${removedGod}」`);
    announcements.push({
      roomId,
      title: "送神术发动",
      text: `【${roleName}】送走了【${getRoleName(target)}】身上的「${removedGod}」`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "auction_card") {
    const tileIndex = player.position;
    const tile = state.board[tileIndex];
    const cfg = getTileConfig(tileIndex);
    if (!tile || cfg.kind !== "property") {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    tile.ownerPlayerId = null;
    tile.ownerCharacterId = null;
    tile.level = 0;
    tile.rent = cfg.rentByLevel[0] ?? cfg.rent;
    events.push(`【公告】${roleName} 使用拍卖卡，将「${getTileDisplayName(roomId, tileIndex)}」打回平地`);
    announcements.push({
      roomId,
      title: "拍卖卡发动",
      text: `【${roleName}】将「${getTileDisplayName(roomId, tileIndex)}」设为无主平地`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "build_card") {
    const tileIndex = typeof targetTileIndex === "number" ? Math.floor(targetTileIndex) : -1;
    const tile = state.board[tileIndex];
    const cfg = getTileConfig(tileIndex);
    if (!tile || cfg.kind !== "property" || tile.ownerPlayerId !== player.playerId) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const maxLevel = Math.max(0, (cfg.rentByLevel?.length ?? 1) - 1);
    if (tile.level >= maxLevel) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    tile.level = Math.min(tile.level + 1, maxLevel);
    tile.rent = cfg.rentByLevel[tile.level] ?? tile.rent;
    events.push(`【公告】${roleName} 使用建筑卡，升级了「${getTileDisplayName(roomId, tileIndex)}」至 Lv.${tile.level}`);
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events
    };
  }

  if (itemId === "equal_poor_card") {
    if (!targetPlayerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const target = getPlayerById(state, targetPlayerId);
    if (!target || target.status !== "active") {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const minCash = state.players
      .filter((item) => item.status === "active")
      .reduce((min, item) => Math.min(min, item.cash), Number.POSITIVE_INFINITY);
    const finalCash = Number.isFinite(minCash) ? minCash : target.cash;
    const before = target.cash;
    target.cash = Math.min(target.cash, finalCash);
    events.push(`【公告】${roleName} 对【${getRoleName(target)}】使用均贫卡：${before} -> ${target.cash}`);
    announcements.push({
      roomId,
      title: "均贫卡发动",
      text: `【${roleName}】让【${getRoleName(target)}】的金钱与最穷者一致`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "equal_rich_card") {
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const maxCash = state.players
      .filter((item) => item.status === "active")
      .reduce((max, item) => Math.max(max, item.cash), 0);
    const before = player.cash;
    player.cash = Math.max(player.cash, maxCash);
    events.push(`【公告】${roleName} 使用均富卡：${before} -> ${player.cash}`);
    announcements.push({
      roomId,
      title: "均富卡发动",
      text: `【${roleName}】让自己的金钱与最富者一致`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "nanman_card") {
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const losses: string[] = [];
    state.players.forEach((entryPlayer) => {
      if (entryPlayer.status !== "active") {
        return;
      }
      const propertyCount = state.board.filter((tile) => tile.ownerPlayerId === entryPlayer.playerId).length;
      const damage = propertyCount * 100;
      entryPlayer.cash -= damage;
      losses.push(`${getRoleName(entryPlayer)}-${damage}`);
    });
    events.push(`【公告】${roleName} 发动南蛮入侵：${losses.join("，")}`);
    announcements.push({
      roomId,
      title: "南蛮入侵",
      text: `【${roleName}】发动南蛮入侵，全员按地产数量损失金钱`
    });
    const record = rooms.get(roomId);
    if (record) {
      settleBankruptcyAndVictory(record, events, announcements);
    }
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "outlaw_card") {
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    player.effects.outlawActive = true;
    events.push(`【公告】${roleName} 使用了「落草为寇」，下次遭遇其他角色将抢走其 15% 金钱`);
    announcements.push({
      roomId,
      title: "道具发动",
      text: `【${roleName}】使用了「落草为寇」`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "frame_card") {
    if (!targetPlayerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const target = getPlayerById(state, targetPlayerId);
    if (!target || target.status !== "active" || target.playerId === player.playerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const distance = circularDistance(player.position, target.position, state.board.length);
    if (distance > 4) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const jailIndex = getJailTileIndex();
    target.position = jailIndex;
    target.effects.jailTurns = 3;
    events.push(`【公告】${roleName} 对【${getRoleName(target)}】使用陷害卡，押入牢狱 3 回合`);
    announcements.push({
      roomId,
      title: "陷害卡发动",
      text: `【${roleName}】将【${getRoleName(target)}】送入牢狱（3回合）`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "steal_card") {
    if (!targetPlayerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const target = getPlayerById(state, targetPlayerId);
    if (!target || target.status !== "active" || target.playerId === player.playerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const distance = circularDistance(player.position, target.position, state.board.length);
    if (distance > 4) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const pool = target.items.filter((item) => item.count > 0);
    if (pool.length === 0) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    const stolen = pool[Math.floor(Math.random() * pool.length)]!;
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    consumeItem(target, stolen.itemId);
    addItem(player, stolen.itemId, 1);
    events.push(`【公告】${roleName} 对【${getRoleName(target)}】使用抢夺卡，夺取了 1 张道具`);
    announcements.push({
      roomId,
      title: "道具发动",
      text: `【${roleName}】对【${getRoleName(target)}】使用了「抢夺卡」`
    });
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events,
      announcements
    };
  }

  if (itemId === "turtle_card") {
    if (!targetPlayerId) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    const target = getPlayerById(state, targetPlayerId);
    if (!target || target.status !== "active") {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    if (!consumeItem(player, itemId)) {
      return { ok: false, code: "ERR_INVALID_ACTION" };
    }
    target.effects.turtleTurns += 3;
    events.push(`【${roleName}】对【${getRoleName(target)}】使用乌龟卡，接下来三回合固定掷出 1 点`);
    return {
      ok: true,
      state,
      result: { roomId, playerId: player.playerId, itemId, consumed: true },
      events
    };
  }

  return { ok: false, code: "ERR_INVALID_ACTION" };
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
  const state = entry.state;
  if (state.status !== "waiting") {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  if (state.hostPlayerId !== entry.player.playerId) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  const connectedPlayers = state.players.filter((item) => item.connected);
  if (connectedPlayers.length < 2) {
    return { ok: false, code: "GAME_NOT_READY" };
  }
  if (!connectedPlayers.every((item) => item.ready)) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  state.status = "in_game";
  state.players.forEach((item) => {
    if (item.status !== "left") {
      item.cash = state.initialCash;
    }
  });
  state.phase = computePhase(connectedPlayers.length);
  if (!state.currentTurnPlayerId) {
    state.currentTurnPlayerId = connectedPlayers[0].playerId;
  }
  state.pendingBuyTileIndex = null;
  state.pendingAction = null;
  state.turnSeq = 0;
  const record = rooms.get(roomId);
  if (record) {
    clearPendingAction(record);
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

export function setInitialCash(socketId: string, roomId: RoomId, amount: number): RoomActionResult {
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
  const normalized = Math.floor(amount);
  if (!Number.isFinite(normalized) || normalized < MIN_INITIAL_CASH || normalized > MAX_INITIAL_CASH) {
    return { ok: false, code: "ERR_INVALID_ACTION" };
  }
  entry.state.initialCash = normalized;
  entry.state.players.forEach((item) => {
    if (item.status !== "left") {
      item.cash = normalized;
    }
  });
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
      action: "set_initial_cash"
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

  const leaveRecord = rooms.get(roomId);
  if (leaveRecord && leaveRecord.state.pendingAction && leaveRecord.state.pendingAction.targetPlayerToken === entry.player.playerToken) {
    clearPendingAction(leaveRecord);
  }
  const pendingTrade = pendingTradeByRoom.get(roomId);
  if (pendingTrade && (pendingTrade.fromPlayerId === entry.player.playerId || pendingTrade.toPlayerId === entry.player.playerId)) {
    pendingTradeByRoom.delete(roomId);
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
