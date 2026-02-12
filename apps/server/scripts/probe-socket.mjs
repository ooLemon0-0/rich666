import { io } from "socket.io-client";

const url = process.env.SERVER_URL ?? "http://localhost:3000";
const path = "/socket.io";

const socket = io(url, {
  path,
  transports: ["polling", "websocket"],
  timeout: 8000
});

socket.on("connect", () => {
  console.log("[probe] connected", {
    socketId: socket.id,
    transport: socket.io.engine.transport.name
  });
  socket.close();
});

socket.on("connect_error", (error) => {
  console.error("[probe] connect_error", {
    message: error.message,
    description: error.description
  });
  process.exitCode = 1;
  socket.close();
});

socket.on("disconnect", (reason) => {
  console.log("[probe] disconnected", { reason });
});
