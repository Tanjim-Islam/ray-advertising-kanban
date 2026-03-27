import type { Server as SocketIOServer } from "socket.io";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/realtime/events";

export type BoardSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
>;

declare global {
  var __boardSocketServer: BoardSocketServer | undefined;
}

export function setSocketServer(socketServer: BoardSocketServer) {
  globalThis.__boardSocketServer = socketServer;
}

export function getSocketServer() {
  return globalThis.__boardSocketServer;
}

export function emitSocketEvent<EventName extends keyof ServerToClientEvents>(
  eventName: EventName,
  ...payload: Parameters<ServerToClientEvents[EventName]>
) {
  globalThis.__boardSocketServer?.emit(eventName, ...payload);
}
