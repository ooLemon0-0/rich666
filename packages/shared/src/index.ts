export type RoomId = string;
export type PlayerId = string;
export type SelfRole = "player" | "spectator";
export type PlayerStatus = "active" | "left" | "disconnected";
export type RoomPhase = "waiting" | "rolling" | "moving" | "can_buy";
export type RoomStatus = "waiting" | "in_game" | "ended";
export const BOARD_SIZE = 40;

export interface Player {
  playerId: PlayerId;
  nickname: string;
  position: number;
  cash: number;
  connected: boolean;
  joinedAt: number;
  ready: boolean;
  selectedCharacterId: string | null;
  playerToken: string;
  status: PlayerStatus;
}

export interface Spectator {
  spectatorId: string;
  nickname: string;
  connected: boolean;
  joinedAt: number;
  playerToken: string;
}

export interface Tile {
  index: number;
  ownerPlayerId: PlayerId | null;
  ownerCharacterId: string | null;
  price: number;
  rent: number;
}

export interface RoomState {
  roomId: RoomId;
  status: RoomStatus;
  hostPlayerId: PlayerId;
  currentTurnPlayerId: PlayerId | null;
  phase: RoomPhase;
  players: Player[];
  spectators: Spectator[];
  board: Tile[];
  pendingBuyTileIndex: number | null;
  lastRoll: {
    playerId: PlayerId;
    value: number;
  } | null;
}

export interface CreateRoomPayload {
  nickname: string;
  playerToken: string;
}

export interface JoinRoomPayload {
  roomId: RoomId;
  nickname: string;
  playerToken: string;
}

export interface RollRequestPayload {
  roomId: RoomId;
}
export interface BuyRequestPayload {
  roomId: RoomId;
}
export interface SkipBuyPayload {
  roomId: RoomId;
}
export interface ReconnectRequestPayload {
  roomId: RoomId;
  playerId: PlayerId;
}
export interface SelectCharacterPayload {
  roomId: RoomId;
  characterId: string;
}
export interface ToggleReadyPayload {
  roomId: RoomId;
}
export interface StartGamePayload {
  roomId: RoomId;
}
export interface LeaveRoomPayload {
  roomId: RoomId;
  playerToken: string;
}

export interface JoinOrCreateRoomAck {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  role: SelfRole;
  reconnected?: boolean;
}

export interface ErrorPayload {
  ok: false;
  code:
    | "ROOM_NOT_FOUND"
    | "ROOM_ENDED"
    | "INVALID_PAYLOAD"
    | "ROOM_FULL"
    | "ROOM_MISMATCH"
    | "NOT_YOUR_TURN"
    | "GAME_NOT_READY"
    | "NOT_BUY_PHASE"
    | "TILE_NOT_BUYABLE"
    | "INSUFFICIENT_CASH"
    | "PLAYER_NOT_FOUND"
    | "CHAR_TAKEN"
    | "ERR_INVALID_ACTION";
  message: string;
}
export interface SocketErrorPayload {
  code: string;
  message: string;
}
export interface DiceRolledPayload {
  roomId: RoomId;
  playerId: PlayerId;
  value: number;
}
export interface GameSystemEventPayload {
  roomId: RoomId;
  text: string;
}
export type StaticTileKind = "special" | "property";
export interface StaticTileConfig {
  index: number;
  tileId: string;
  name: string;
  kind: StaticTileKind;
  price: number;
  rent: number;
}
export interface GameStaticConfigPayload {
  roomId: RoomId;
  version: number;
  tiles: StaticTileConfig[];
}

export type JoinOrCreateRoomResult = JoinOrCreateRoomAck | ErrorPayload;
export interface RollSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  dice: number;
  position: number;
}
export type RollRequestResult = RollSuccessPayload | ErrorPayload;
export interface TradeActionSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  action: "buy" | "skip_buy";
}
export type TradeActionResult = TradeActionSuccessPayload | ErrorPayload;
export interface RoomActionSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  action: "select_character" | "toggle_ready" | "start_game" | "leave_room";
}
export type RoomActionResult = RoomActionSuccessPayload | ErrorPayload;
export interface ReconnectSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
}
export type ReconnectRequestResult = ReconnectSuccessPayload | ErrorPayload;

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, ack: (result: JoinOrCreateRoomResult) => void) => void;
  join_room: (payload: JoinRoomPayload, ack: (result: JoinOrCreateRoomResult) => void) => void;
  roll_request: (payload: RollRequestPayload, ack: (result: RollRequestResult) => void) => void;
  buy_request: (payload: BuyRequestPayload, ack: (result: TradeActionResult) => void) => void;
  skip_buy: (payload: SkipBuyPayload, ack: (result: TradeActionResult) => void) => void;
  reconnect_request: (
    payload: ReconnectRequestPayload,
    ack: (result: ReconnectRequestResult) => void
  ) => void;
  room_select_character: (payload: SelectCharacterPayload, ack: (result: RoomActionResult) => void) => void;
  room_toggle_ready: (payload: ToggleReadyPayload, ack: (result: RoomActionResult) => void) => void;
  room_start_game: (payload: StartGamePayload, ack: (result: RoomActionResult) => void) => void;
  room_leave: (payload: LeaveRoomPayload, ack: (result: RoomActionResult) => void) => void;
}

export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  "room:state": (state: RoomState) => void;
  "game:diceRolled": (payload: DiceRolledPayload) => void;
  "game:systemEvent": (payload: GameSystemEventPayload) => void;
  "game:staticConfig": (payload: GameStaticConfigPayload) => void;
  error: (error: SocketErrorPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId?: string;
  roomId?: RoomId;
}
