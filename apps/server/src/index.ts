import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import type { AddressInfo } from "node:net";
import {
  BOARD_SIZE,
  type BuyRequestPayload,
  type ClientToServerEvents,
  type CreateRoomPayload,
  type ErrorPayload,
  type InterServerEvents,
  type JoinRoomPayload,
  type JoinOrCreateRoomResult,
  type ReconnectRequestPayload,
  type ReconnectRequestResult,
  type RollRequestPayload,
  type RollRequestResult,
  type SocketErrorPayload,
  type SkipBuyPayload,
  type ServerToClientEvents,
  type SocketData
} from "@rich/shared";
import {
  buyRequest,
  createRoom,
  disconnectSocket,
  getPlayerRefBySocket,
  joinRoom,
  reconnectPlayer,
  rollRequest,
  skipBuy
} from "./game/roomManager.js";

const app = Fastify({ logger: true });
const WEB_ORIGIN = "http://localhost:5173";
const SOCKET_PATH = "/socket.io";
await app.register(cors, {
  origin: WEB_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
});

app.get("/health", async () => ({ ok: true, ts: Date.now() }));

// Socket.IO is mounted on Fastify's underlying Node http server.
// This ensures HTTP routes and WebSocket upgrade share one server/port.
const httpServer = app.server;
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    path: SOCKET_PATH,
    transports: ["polling", "websocket"],
    cors: {
      origin: WEB_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  }
);

function normalizeNickname(value: string): string {
  return value.trim().slice(0, 20);
}

function invalidPayload(message: string): ErrorPayload {
  return {
    ok: false,
    code: "INVALID_PAYLOAD",
    message
  };
}

function roomNotFound(): ErrorPayload {
  return {
    ok: false,
    code: "ROOM_NOT_FOUND",
    message: "房间不存在"
  };
}

function roomFull(): ErrorPayload {
  return {
    ok: false,
    code: "ROOM_FULL",
    message: "房间已满"
  };
}

function roomMismatch(): ErrorPayload {
  return {
    ok: false,
    code: "ROOM_MISMATCH",
    message: "当前连接不属于该房间"
  };
}

function notYourTurn(): ErrorPayload {
  return {
    ok: false,
    code: "NOT_YOUR_TURN",
    message: "还没轮到你掷骰"
  };
}

function gameNotReady(): ErrorPayload {
  return {
    ok: false,
    code: "GAME_NOT_READY",
    message: "至少需要 2 名玩家才可开始"
  };
}

function notBuyPhase(): ErrorPayload {
  return {
    ok: false,
    code: "NOT_BUY_PHASE",
    message: "当前阶段不能买地"
  };
}

function tileNotBuyable(): ErrorPayload {
  return {
    ok: false,
    code: "TILE_NOT_BUYABLE",
    message: "当前地块不可购买"
  };
}

function insufficientCash(): ErrorPayload {
  return {
    ok: false,
    code: "INSUFFICIENT_CASH",
    message: "现金不足，无法购买地块"
  };
}

function playerNotFound(): ErrorPayload {
  return {
    ok: false,
    code: "PLAYER_NOT_FOUND",
    message: "玩家不存在或已失效"
  };
}

function emitRoomState(roomId: string, state: ReturnType<typeof createRoom>): void {
  io.to(roomId).emit("room_state", state);
}

function ackAndEmitError<TErrorResult>(
  socketId: string,
  ack: (result: TErrorResult) => void,
  error: ErrorPayload
): void {
  app.log.warn({ socketId, error }, "socket request rejected");
  ack(error as TErrorResult);
  const errorPayload: SocketErrorPayload = { code: error.code, message: error.message };
  io.to(socketId).emit("error", errorPayload);
}

io.on("connection", (socket) => {
  app.log.info(
    {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      origin: socket.handshake.headers.origin
    },
    "socket connected"
  );

  socket.conn.on("upgrade", () => {
    app.log.info(
      { socketId: socket.id, transport: socket.conn.transport.name },
      "socket transport upgraded"
    );
  });

  socket.on("create_room", (payload: CreateRoomPayload, ack) => {
    const nickname = normalizeNickname(payload.nickname);
    if (!nickname) {
      ackAndEmitError(socket.id, ack, invalidPayload("昵称不能为空"));
      return;
    }

    const state = createRoom(socket.id, nickname);
    const playerRef = getPlayerRefBySocket(socket.id);
    if (!playerRef) {
      ackAndEmitError(socket.id, ack, roomNotFound());
      return;
    }
    socket.data.playerId = playerRef.playerId;
    socket.data.roomId = state.roomId;
    socket.join(state.roomId);

    const result: JoinOrCreateRoomResult = {
      ok: true,
      roomId: state.roomId,
      playerId: playerRef.playerId
    };
    ack(result);
    emitRoomState(state.roomId, state);
    app.log.info({ socketId: socket.id, roomId: state.roomId }, "room created");
  });

  socket.on("join_room", (payload: JoinRoomPayload, ack) => {
    const nickname = normalizeNickname(payload.nickname);
    const roomId = payload.roomId.trim().toUpperCase();

    if (!nickname || !roomId) {
      ackAndEmitError(socket.id, ack, invalidPayload("roomId 和昵称不能为空"));
      return;
    }

    const joinResult = joinRoom(socket.id, roomId, nickname);
    if (!joinResult.ok || !joinResult.state) {
      const error = joinResult.code === "ROOM_FULL" ? roomFull() : roomNotFound();
      ackAndEmitError(socket.id, ack, error);
      return;
    }
    const state = joinResult.state;

    const playerRef = getPlayerRefBySocket(socket.id);
    if (!playerRef) {
      ackAndEmitError(socket.id, ack, roomNotFound());
      return;
    }
    socket.data.playerId = playerRef.playerId;
    socket.data.roomId = state.roomId;
    socket.join(state.roomId);

    const result: JoinOrCreateRoomResult = {
      ok: true,
      roomId: state.roomId,
      playerId: playerRef.playerId
    };
    ack(result);
    emitRoomState(state.roomId, state);
    app.log.info({ socketId: socket.id, roomId: state.roomId }, "room joined");
  });

  socket.on("reconnect_request", (payload: ReconnectRequestPayload, ack) => {
    const roomId = payload.roomId.trim().toUpperCase();
    const playerId = payload.playerId.trim();
    if (!roomId || !playerId) {
      ackAndEmitError<ReconnectRequestResult>(socket.id, ack, invalidPayload("roomId 和 playerId 不能为空"));
      return;
    }

    const reconnectResult = reconnectPlayer(socket.id, roomId, playerId);
    if (!reconnectResult.ok || !reconnectResult.state || !reconnectResult.result) {
      let error: ErrorPayload = roomNotFound();
      if (reconnectResult.code === "PLAYER_NOT_FOUND") {
        error = playerNotFound();
      } else if (reconnectResult.code === "ROOM_MISMATCH") {
        error = roomMismatch();
      }
      ackAndEmitError<ReconnectRequestResult>(socket.id, ack, error);
      return;
    }

    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.join(roomId);

    if (reconnectResult.kickedSocketId) {
      const oldSocket = io.sockets.sockets.get(reconnectResult.kickedSocketId);
      if (oldSocket) {
        app.log.warn(
          { playerId, oldSocketId: reconnectResult.kickedSocketId, newSocketId: socket.id },
          "duplicate player connection detected, kicking old socket"
        );
        oldSocket.disconnect(true);
      }
    }

    ack(reconnectResult.result);
    emitRoomState(roomId, reconnectResult.state);
    app.log.info({ socketId: socket.id, roomId, playerId }, "player reconnected");
  });

  socket.on("roll_request", (payload: RollRequestPayload, ack) => {
    const roomId = payload.roomId.trim().toUpperCase();
    if (!roomId) {
      ackAndEmitError<RollRequestResult>(socket.id, ack, invalidPayload("roomId 不能为空"));
      return;
    }

    const roll = rollRequest(socket.id, roomId);
    if (!roll.ok || !roll.state || !roll.result) {
      let error: ErrorPayload = roomNotFound();
      if (roll.code === "ROOM_MISMATCH") {
        error = roomMismatch();
      } else if (roll.code === "NOT_YOUR_TURN") {
        error = notYourTurn();
      } else if (roll.code === "GAME_NOT_READY") {
        error = gameNotReady();
      }
      app.log.warn({ socketId: socket.id, roomId, error }, "roll request rejected");
      ackAndEmitError<RollRequestResult>(socket.id, ack, error);
      return;
    }

    ack(roll.result);
    emitRoomState(roomId, roll.state);
    app.log.info(
      {
        socketId: socket.id,
        roomId,
        dice: roll.result.dice,
        position: roll.result.position,
        nextTurn: roll.state.currentTurnPlayerId,
        boardSize: BOARD_SIZE
      },
      "roll applied"
    );
  });

  socket.on("buy_request", (payload: BuyRequestPayload, ack) => {
    const roomId = payload.roomId.trim().toUpperCase();
    if (!roomId) {
      ackAndEmitError(socket.id, ack, invalidPayload("roomId 不能为空"));
      return;
    }
    const result = buyRequest(socket.id, roomId);
    if (!result.ok || !result.state || !result.result) {
      let error: ErrorPayload = roomNotFound();
      if (result.code === "ROOM_MISMATCH") {
        error = roomMismatch();
      } else if (result.code === "NOT_YOUR_TURN") {
        error = notYourTurn();
      } else if (result.code === "NOT_BUY_PHASE") {
        error = notBuyPhase();
      } else if (result.code === "TILE_NOT_BUYABLE") {
        error = tileNotBuyable();
      } else if (result.code === "INSUFFICIENT_CASH") {
        error = insufficientCash();
      }
      ackAndEmitError(socket.id, ack, error);
      return;
    }
    ack(result.result);
    emitRoomState(roomId, result.state);
    app.log.info({ socketId: socket.id, roomId, action: "buy" }, "trade applied");
  });

  socket.on("skip_buy", (payload: SkipBuyPayload, ack) => {
    const roomId = payload.roomId.trim().toUpperCase();
    if (!roomId) {
      ackAndEmitError(socket.id, ack, invalidPayload("roomId 不能为空"));
      return;
    }
    const result = skipBuy(socket.id, roomId);
    if (!result.ok || !result.state || !result.result) {
      let error: ErrorPayload = roomNotFound();
      if (result.code === "ROOM_MISMATCH") {
        error = roomMismatch();
      } else if (result.code === "NOT_YOUR_TURN") {
        error = notYourTurn();
      } else if (result.code === "NOT_BUY_PHASE") {
        error = notBuyPhase();
      } else if (result.code === "TILE_NOT_BUYABLE") {
        error = tileNotBuyable();
      } else if (result.code === "INSUFFICIENT_CASH") {
        error = insufficientCash();
      }
      ackAndEmitError(socket.id, ack, error);
      return;
    }
    ack(result.result);
    emitRoomState(roomId, result.state);
    app.log.info({ socketId: socket.id, roomId, action: "skip_buy" }, "trade applied");
  });

  socket.on("disconnect", (reason) => {
    app.log.info(
      { socketId: socket.id, reason, transport: socket.conn.transport.name },
      "socket disconnected"
    );
    const state = disconnectSocket(socket.id);
    if (!state) {
      return;
    }
    emitRoomState(state.roomId, state);
  });

  socket.on("error", (error) => {
    app.log.error({ socketId: socket.id, error }, "socket error");
  });
});

io.engine.on("connection_error", (error) => {
  app.log.error(
    {
      code: error.code,
      message: error.message,
      context: error.context
    },
    "engine connection error"
  );
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
await app.listen({ port, host });
const address = app.server.address() as AddressInfo | null;
if (address) {
  app.log.info(
    {
      host,
      port,
      listening: `http://${host}:${port}`,
      local: `http://localhost:${address.port}`,
      socketPath: SOCKET_PATH
    },
    "server listening"
  );
}
