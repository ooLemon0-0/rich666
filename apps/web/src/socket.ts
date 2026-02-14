import { io, type Socket } from "socket.io-client";
import type {
  BuyRequestPayload,
  ClientToServerEvents,
  DiceRolledPayload,
  GameLandingResolvedPayload,
  GameStaticConfigPayload,
  GameSystemEventPayload,
  JoinOrCreateRoomResult,
  RoomActionResult,
  ReconnectRequestResult,
  RollRequestResult,
  RoomState,
  SocketErrorPayload,
  SkipBuyPayload,
  TradeActionResult,
  ServerToClientEvents
} from "@rich/shared";

function normalizeServerUrl(raw: string): string {
  const value = raw.trim();
  // socket.io-client expects an HTTP(S) origin. If ws:// is provided by mistake,
  // normalize to http:// so the client can still negotiate transport correctly.
  if (value.startsWith("ws://")) {
    return value.replace("ws://", "http://");
  }
  if (value.startsWith("wss://")) {
    return value.replace("wss://", "https://");
  }
  return value;
}

function resolveSocketBaseUrl(): string {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  if (explicitUrl) {
    return normalizeServerUrl(explicitUrl);
  }
  // Default to same-origin in production/deployment behind nginx reverse proxy.
  return window.location.origin;
}

const SERVER_URL = resolveSocketBaseUrl();
const SOCKET_PATH = "/socket.io";
const SESSION_STORAGE_KEY = "rich:session";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

type RoomStateHandler = (state: RoomState) => void;
type DiceRolledHandler = (payload: DiceRolledPayload) => void;
type LandingResolvedHandler = (payload: GameLandingResolvedPayload) => void;
type SystemEventHandler = (payload: GameSystemEventPayload) => void;
type StaticConfigHandler = (payload: GameStaticConfigPayload) => void;
type ErrorHandler = (error: SocketErrorPayload) => void;
type ConnectionHandler = (status: ConnectionStatus) => void;
type SocketConnectError = Error & { description?: unknown; context?: unknown };

interface SessionSnapshot {
  roomId: string;
  playerId: string;
}

interface SocketClient {
  connect: () => void;
  disconnect: () => void;
  createRoom: (nickname: string, playerToken: string) => Promise<JoinOrCreateRoomResult>;
  joinRoom: (roomId: string, nickname: string, playerToken: string) => Promise<JoinOrCreateRoomResult>;
  rollRequest: (roomId: string) => Promise<RollRequestResult>;
  buyRequest: (roomId: string) => Promise<TradeActionResult>;
  skipBuy: (roomId: string) => Promise<TradeActionResult>;
  selectCharacter: (roomId: string, characterId: string) => Promise<ClientRoomActionResult>;
  toggleReady: (roomId: string) => Promise<RoomActionResult>;
  startGame: (roomId: string) => Promise<RoomActionResult>;
  leaveRoom: (roomId: string, playerToken: string) => Promise<RoomActionResult>;
  setSession: (session: SessionSnapshot) => void;
  clearSession: () => void;
  getSession: () => SessionSnapshot | null;
  subscribeRoomState: (handler: RoomStateHandler) => () => void;
  subscribeDiceRolled: (handler: DiceRolledHandler) => () => void;
  subscribeLandingResolved: (handler: LandingResolvedHandler) => () => void;
  subscribeSystemEvent: (handler: SystemEventHandler) => () => void;
  subscribeStaticConfig: (handler: StaticConfigHandler) => () => void;
  subscribeError: (handler: ErrorHandler) => () => void;
  subscribeConnection: (handler: ConnectionHandler) => () => void;
  getStatus: () => ConnectionStatus;
}

interface ClientActionError {
  ok: false;
  code: "SOCKET_DISCONNECTED" | "TIMEOUT";
  message: string;
}

export type ClientRoomActionResult = RoomActionResult | ClientActionError;

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let status: ConnectionStatus = "disconnected";
let reconnectingFromSession = false;

const roomStateListeners = new Set<RoomStateHandler>();
const diceRolledListeners = new Set<DiceRolledHandler>();
const landingResolvedListeners = new Set<LandingResolvedHandler>();
const systemEventListeners = new Set<SystemEventHandler>();
const staticConfigListeners = new Set<StaticConfigHandler>();
const errorListeners = new Set<ErrorHandler>();
const connectionListeners = new Set<ConnectionHandler>();

function emitConnectionStatus(next: ConnectionStatus): void {
  status = next;
  connectionListeners.forEach((handler) => handler(next));
}

function readSession(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (!data.roomId || !data.playerId) {
      return null;
    }
    return { roomId: data.roomId, playerId: data.playerId };
  } catch {
    return null;
  }
}

function writeSession(session: SessionSnapshot): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function removeSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function emitSocketError(error: SocketErrorPayload): void {
  errorListeners.forEach((handler) => handler(error));
}

function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socketInstance) {
    return socketInstance;
  }

  const socket = io(SERVER_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
    timeout: 8_000,
    path: SOCKET_PATH,
    transports: ["websocket", "polling"],
    withCredentials: false
  });

  socket.on("connect", () => {
    emitConnectionStatus("connected");
    const session = readSession();
    if (!session || reconnectingFromSession) {
      return;
    }
    reconnectingFromSession = true;
    socket.emit(
      "reconnect_request",
      { roomId: session.roomId, playerId: session.playerId },
      (result: ReconnectRequestResult) => {
        reconnectingFromSession = false;
        if (!result.ok) {
          removeSession();
          emitSocketError({ code: result.code, message: result.message });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    emitConnectionStatus("disconnected");
  });

  socket.on("connect_error", (error) => {
    const connectError = error as SocketConnectError;
    console.error("[socket] connect_error: socket connection failed", {
      url: SERVER_URL,
      path: SOCKET_PATH,
      message: connectError.message,
      description: connectError.description,
      context: connectError.context,
      suggestion: "检查 nginx /socket.io 反代、后端进程与安全组端口"
    });
    emitSocketError({ code: "ROOM_NOT_FOUND", message: `连接失败: ${connectError.message}` });
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.info("[socket] reconnect_attempt", { attempt, url: SERVER_URL, path: SOCKET_PATH });
    emitConnectionStatus("connecting");
  });

  socket.on("room_state", (state) => {
    roomStateListeners.forEach((handler) => handler(state));
  });
  socket.on("room:state", (state) => {
    roomStateListeners.forEach((handler) => handler(state));
  });

  socket.on("error", (error) => {
    emitSocketError(error);
  });
  socket.on("game:diceRolled", (payload) => {
    diceRolledListeners.forEach((handler) => handler(payload));
  });
  socket.on("game:systemEvent", (payload) => {
    systemEventListeners.forEach((handler) => handler(payload));
  });
  socket.on("game:landingResolved", (payload) => {
    landingResolvedListeners.forEach((handler) => handler(payload));
  });
  socket.on("game:staticConfig", (payload) => {
    staticConfigListeners.forEach((handler) => handler(payload));
  });

  socketInstance = socket;
  return socket;
}

function withAck<T>(runner: (ack: (result: T) => void) => void): Promise<T> {
  return new Promise<T>((resolve) => {
    runner((result) => resolve(result));
  });
}

function withAckTimeout<T>(
  runner: (ack: (result: T) => void) => void,
  timeoutMs: number,
  timeoutResult: T
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(timeoutResult);
    }, timeoutMs);
    runner((result) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    });
  });
}

export function createSocketClient(): SocketClient {
  return {
    connect() {
      const socket = getSocket();
      if (socket.connected) {
        emitConnectionStatus("connected");
        return;
      }
      emitConnectionStatus("connecting");
      socket.connect();
    },
    disconnect() {
      const socket = getSocket();
      socket.disconnect();
      emitConnectionStatus("disconnected");
    },
    createRoom(nickname, playerToken) {
      const socket = getSocket();
      return withAck<JoinOrCreateRoomResult>((ack) => {
        socket.emit("create_room", { nickname, playerToken }, ack);
      });
    },
    joinRoom(roomId, nickname, playerToken) {
      const socket = getSocket();
      return withAck<JoinOrCreateRoomResult>((ack) => {
        socket.emit("join_room", { roomId, nickname, playerToken }, ack);
      });
    },
    rollRequest(roomId) {
      const socket = getSocket();
      return withAck<RollRequestResult>((ack) => {
        socket.emit("roll_request", { roomId }, ack);
      });
    },
    buyRequest(roomId) {
      const socket = getSocket();
      return withAck<TradeActionResult>((ack) => {
        const payload: BuyRequestPayload = { roomId };
        socket.emit("buy_request", payload, ack);
      });
    },
    skipBuy(roomId) {
      const socket = getSocket();
      return withAck<TradeActionResult>((ack) => {
        const payload: SkipBuyPayload = { roomId };
        socket.emit("skip_buy", payload, ack);
      });
    },
    selectCharacter(roomId, characterId) {
      const socket = getSocket();
      if (!socket.connected) {
        return Promise.resolve({
          ok: false,
          code: "SOCKET_DISCONNECTED",
          message: "连接未就绪，请稍后重试"
        } as ClientRoomActionResult);
      }
      return withAckTimeout<ClientRoomActionResult>(
        (ack) => {
          socket.emit("room_select_character", { roomId, characterId }, ack);
        },
        4500,
        {
          ok: false,
          code: "TIMEOUT",
          message: "请求超时，请检查网络或重试"
        }
      );
    },
    toggleReady(roomId) {
      const socket = getSocket();
      return withAck<RoomActionResult>((ack) => {
        socket.emit("room_toggle_ready", { roomId }, ack);
      });
    },
    startGame(roomId) {
      const socket = getSocket();
      return withAck<RoomActionResult>((ack) => {
        socket.emit("room_start_game", { roomId }, ack);
      });
    },
    leaveRoom(roomId, playerToken) {
      const socket = getSocket();
      return withAck<RoomActionResult>((ack) => {
        socket.emit("room_leave", { roomId, playerToken }, ack);
      });
    },
    subscribeRoomState(handler) {
      roomStateListeners.add(handler);
      return () => {
        roomStateListeners.delete(handler);
      };
    },
    subscribeError(handler) {
      errorListeners.add(handler);
      return () => {
        errorListeners.delete(handler);
      };
    },
    subscribeDiceRolled(handler) {
      diceRolledListeners.add(handler);
      return () => {
        diceRolledListeners.delete(handler);
      };
    },
    subscribeSystemEvent(handler) {
      systemEventListeners.add(handler);
      return () => {
        systemEventListeners.delete(handler);
      };
    },
    subscribeLandingResolved(handler) {
      landingResolvedListeners.add(handler);
      return () => {
        landingResolvedListeners.delete(handler);
      };
    },
    subscribeStaticConfig(handler) {
      staticConfigListeners.add(handler);
      return () => {
        staticConfigListeners.delete(handler);
      };
    },
    setSession(session) {
      writeSession(session);
    },
    clearSession() {
      removeSession();
    },
    getSession() {
      return readSession();
    },
    subscribeConnection(handler) {
      connectionListeners.add(handler);
      handler(status);
      return () => {
        connectionListeners.delete(handler);
      };
    },
    getStatus() {
      return status;
    }
  };
}
