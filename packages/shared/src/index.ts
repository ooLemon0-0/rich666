export type RoomId = string;
export type PlayerId = string;
export type RoomPhase = "waiting" | "rolling" | "moving" | "can_buy";
export const BOARD_SIZE = 20;

export interface Player {
  playerId: PlayerId;
  nickname: string;
  position: number;
  cash: number;
  connected: boolean;
  joinedAt: number;
}

export interface Tile {
  index: number;
  ownerPlayerId: PlayerId | null;
  price: number;
  rent: number;
}

export interface RoomState {
  roomId: RoomId;
  hostPlayerId: PlayerId;
  currentTurnPlayerId: PlayerId | null;
  phase: RoomPhase;
  players: Player[];
  board: Tile[];
  pendingBuyTileIndex: number | null;
  lastRoll: {
    playerId: PlayerId;
    value: number;
  } | null;
}

export interface CreateRoomPayload {
  nickname: string;
}

export interface JoinRoomPayload {
  roomId: RoomId;
  nickname: string;
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

export interface JoinOrCreateRoomAck {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
}

export interface ErrorPayload {
  ok: false;
  code:
    | "ROOM_NOT_FOUND"
    | "INVALID_PAYLOAD"
    | "ROOM_FULL"
    | "ROOM_MISMATCH"
    | "NOT_YOUR_TURN"
    | "GAME_NOT_READY"
    | "NOT_BUY_PHASE"
    | "TILE_NOT_BUYABLE"
    | "INSUFFICIENT_CASH"
    | "PLAYER_NOT_FOUND";
  message: string;
}
export interface SocketErrorPayload {
  code: string;
  message: string;
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
}

export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  error: (error: SocketErrorPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId?: PlayerId;
  roomId?: RoomId;
}
