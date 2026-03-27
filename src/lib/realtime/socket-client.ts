"use client";

import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/realtime/events";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocketClient() {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      autoConnect: false,
    });
  }

  return socket;
}
