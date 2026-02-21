export type RoomId = string;
export type PlayerId = string;
export type SelfRole = "player" | "spectator";
export type PlayerStatus = "active" | "left" | "disconnected";
export type RoomPhase = "waiting" | "rolling" | "moving" | "can_buy";
export type RoomStatus = "waiting" | "in_game" | "ended";
export const BOARD_SIZE = 72;
export type PendingActionType = "BUY" | "UPGRADE" | "ITEM_SHOP";
export type ItemId =
  | "any_dice"
  | "steal_card"
  | "turtle_card"
  | "outlaw_card"
  | "god_bless"
  | "banish_god"
  | "auction_card"
  | "build_card"
  | "equal_poor_card"
  | "equal_rich_card"
  | "nanman_card"
  | "frame_card";
export type GodId = "land_god" | "fortune_god" | "poor_god" | "holy_mary" | "liu_dehua";

export interface PlayerItem {
  itemId: ItemId;
  count: number;
}

export interface PlayerEffects {
  turtleTurns: number;
  outlawActive: boolean;
  godId: GodId | null;
  godTurns: number;
  jailTurns: number;
}

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
  items: PlayerItem[];
  effects: PlayerEffects;
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
  level: number;
}

export interface RoomState {
  roomId: RoomId;
  status: RoomStatus;
  hostPlayerId: PlayerId;
  initialCash: number;
  currentTurnPlayerId: PlayerId | null;
  phase: RoomPhase;
  players: Player[];
  spectators: Spectator[];
  board: Tile[];
  pendingBuyTileIndex: number | null;
  pendingAction: {
    id: string;
    type: PendingActionType;
    tileIndex: number;
    targetPlayerToken: string;
    shopOfferItemId?: ItemId;
    shopOfferPrice?: number;
    shopOfferDetail?: string;
    createdAt: number;
    expiresAt: number;
  } | null;
  turnSeq: number;
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
export interface ActionDecisionPayload {
  roomId: RoomId;
  actionId: string;
  turnSeq: number;
  playerToken: string;
  decision: "BUY_CONFIRM" | "BUY_SKIP" | "UPGRADE_CONFIRM" | "UPGRADE_SKIP" | "SHOP_CONFIRM" | "SHOP_SKIP";
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
export interface SetInitialCashPayload {
  roomId: RoomId;
  amount: number;
}
export interface LeaveRoomPayload {
  roomId: RoomId;
  playerToken: string;
}
export interface CreateTradeOfferPayload {
  roomId: RoomId;
  targetPlayerId: PlayerId;
  givePropertyIndexes: number[];
  takePropertyIndexes: number[];
  giveCash: number;
  takeCash: number;
  giveItems: string[];
  takeItems: string[];
}
export interface RespondTradeOfferPayload {
  roomId: RoomId;
  tradeId: string;
  accept: boolean;
}
export interface UseItemPayload {
  roomId: RoomId;
  itemId: ItemId;
  targetPlayerId?: PlayerId;
  targetTileIndex?: number;
  desiredDice?: number;
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
export interface GameLandingResolvedPayload {
  roomId: RoomId;
  playerId: PlayerId;
  heroId: string | null;
  tileId: number;
  tileType: "special" | "property";
  action: "BUY_OFFER" | "PAY_RENT" | "UPGRADE_OFFER" | "ITEM_SHOP_OFFER" | "SPECIAL_TRIGGER" | "NOOP";
  amount?: number;
  ownerHeroId?: string | null;
  itemId?: ItemId;
  detail?: string;
}
export interface GameActionRequiredPayload {
  roomId: RoomId;
  targetPlayerId: PlayerId;
  actionId: string;
  actionType: PendingActionType;
  tileIndex: number;
  expiresAt: number;
  turnSeq: number;
  payload: GameLandingResolvedPayload;
}
export interface GameEventPayload {
  roomId: RoomId;
  text: string;
}
export interface GameStaticTileConfig {
  index: number;
  tileId: string;
  name: string;
  kind: "special" | "property";
  price: number;
  rent: number;
}
export interface GameStaticConfigPayload {
  roomId: RoomId;
  version: number;
  tiles: GameStaticTileConfig[];
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
  action: "buy" | "skip_buy" | "upgrade" | "skip_upgrade" | "shop_buy" | "shop_skip";
}
export type TradeActionResult = TradeActionSuccessPayload | ErrorPayload;
export interface RoomActionSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  action: "select_character" | "toggle_ready" | "start_game" | "leave_room" | "set_initial_cash";
}
export type RoomActionResult = RoomActionSuccessPayload | ErrorPayload;
export interface ReconnectSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
}
export type ReconnectRequestResult = ReconnectSuccessPayload | ErrorPayload;
export interface TradeActionSuccessPayload2 {
  ok: true;
  roomId: RoomId;
  tradeId: string;
  status: "sent" | "accepted" | "rejected";
}
export type TradeOfferActionResult = TradeActionSuccessPayload2 | ErrorPayload;
export interface TradeOfferEventPayload {
  roomId: RoomId;
  tradeId: string;
  fromPlayerId: PlayerId;
  toPlayerId: PlayerId;
  fromHeroId: string | null;
  toHeroId: string | null;
  givePropertyIndexes: number[];
  takePropertyIndexes: number[];
  giveCash: number;
  takeCash: number;
  giveItems: string[];
  takeItems: string[];
  createdAt: number;
}
export interface TradeResultEventPayload {
  roomId: RoomId;
  tradeId: string;
  fromPlayerId: PlayerId;
  toPlayerId: PlayerId;
  accepted: boolean;
  text: string;
}
export interface UseItemSuccessPayload {
  ok: true;
  roomId: RoomId;
  playerId: PlayerId;
  itemId: ItemId;
  consumed: boolean;
}
export type UseItemResult = UseItemSuccessPayload | ErrorPayload;
export interface GameItemAnnouncementPayload {
  roomId: RoomId;
  title: string;
  text: string;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, ack: (result: JoinOrCreateRoomResult) => void) => void;
  join_room: (payload: JoinRoomPayload, ack: (result: JoinOrCreateRoomResult) => void) => void;
  roll_request: (payload: RollRequestPayload, ack: (result: RollRequestResult) => void) => void;
  buy_request: (payload: BuyRequestPayload, ack: (result: TradeActionResult) => void) => void;
  skip_buy: (payload: SkipBuyPayload, ack: (result: TradeActionResult) => void) => void;
  game_action_decision: (payload: ActionDecisionPayload, ack: (result: TradeActionResult) => void) => void;
  reconnect_request: (
    payload: ReconnectRequestPayload,
    ack: (result: ReconnectRequestResult) => void
  ) => void;
  room_select_character: (payload: SelectCharacterPayload, ack: (result: RoomActionResult) => void) => void;
  room_toggle_ready: (payload: ToggleReadyPayload, ack: (result: RoomActionResult) => void) => void;
  room_start_game: (payload: StartGamePayload, ack: (result: RoomActionResult) => void) => void;
  room_set_initial_cash: (payload: SetInitialCashPayload, ack: (result: RoomActionResult) => void) => void;
  room_leave: (payload: LeaveRoomPayload, ack: (result: RoomActionResult) => void) => void;
  room_create_trade_offer: (payload: CreateTradeOfferPayload, ack: (result: TradeOfferActionResult) => void) => void;
  room_respond_trade_offer: (payload: RespondTradeOfferPayload, ack: (result: TradeOfferActionResult) => void) => void;
  room_use_item: (payload: UseItemPayload, ack: (result: UseItemResult) => void) => void;
}

export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  "room:state": (state: RoomState) => void;
  "game:diceRolled": (payload: DiceRolledPayload) => void;
  "game:systemEvent": (payload: GameSystemEventPayload) => void;
  "game:landingResolved": (payload: GameLandingResolvedPayload) => void;
  "game:action_required": (payload: GameActionRequiredPayload) => void;
  "game:event": (payload: GameEventPayload) => void;
  "game:staticConfig": (payload: GameStaticConfigPayload) => void;
  "game:itemAnnouncement": (payload: GameItemAnnouncementPayload) => void;
  "room:trade_offer": (payload: TradeOfferEventPayload) => void;
  "room:trade_result": (payload: TradeResultEventPayload) => void;
  error: (error: SocketErrorPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId?: string;
  roomId?: RoomId;
}
