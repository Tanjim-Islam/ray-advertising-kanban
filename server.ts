import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

import { getBoardSnapshot } from "./src/lib/db/queries/board";
import { SOCKET_EVENTS } from "./src/lib/realtime/events";
import { setSocketServer } from "./src/lib/realtime/socket-server";
import { logger } from "./src/lib/utils/logger";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((request, response) => {
    void handle(request, response);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  setSocketServer(io);

  const presence = new Map<string, string>();

  const emitPresence = () => {
    io.emit(SOCKET_EVENTS.presenceUpdated, {
      onlineUserIds: [...new Set(presence.values())],
    });
  };

  io.on("connection", (socket) => {
    void getBoardSnapshot()
      .then((snapshot) => {
        socket.emit(SOCKET_EVENTS.boardHydrated, { snapshot });
      })
      .catch((error) => {
        logger.error("Failed to hydrate board snapshot for socket client.", error);
      });

    socket.on(SOCKET_EVENTS.userChanged, ({ userId }) => {
      presence.set(socket.id, userId);
      emitPresence();
    });

    socket.on("disconnect", () => {
      presence.delete(socket.id);
      emitPresence();
    });
  });

  httpServer.listen(port, hostname, () => {
    logger.info(`Server listening at http://${hostname}:${port}`);
  });
}

void main().catch((error) => {
  logger.error("Failed to start the application server.", error);
  process.exit(1);
});
