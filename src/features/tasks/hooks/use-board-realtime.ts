"use client";

import { startTransition, useEffect, useEffectEvent } from "react";

import { useBoardStoreApi } from "@/features/tasks/store/board-store";
import { useUserStore, useUserStoreApi } from "@/features/tasks/store/user-store";
import type {
  BoardHydratedPayload,
  PresenceUpdatedPayload,
  TaskMutationPayload,
} from "@/lib/realtime/events";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { getSocketClient } from "@/lib/realtime/socket-client";

export function useBoardRealtime() {
  const boardStore = useBoardStoreApi();
  const userStore = useUserStoreApi();
  const currentUserId = useUserStore((state) => state.currentUserId);

  const applySnapshot = useEffectEvent((payload: BoardHydratedPayload) => {
    startTransition(() => {
      boardStore.getState().replaceSnapshot(payload.snapshot);
      userStore.getState().setUsers(payload.snapshot.users);
    });
  });

  const applyMutation = useEffectEvent((payload: TaskMutationPayload) => {
    startTransition(() => {
      boardStore.getState().applyMutation(payload);
    });
  });

  const applyPresence = useEffectEvent((payload: PresenceUpdatedPayload) => {
    userStore.getState().setOnlineUserIds(payload.onlineUserIds);
  });

  useEffect(() => {
    const socket = getSocketClient();

    const handleConnect = () => {
      boardStore.getState().setConnectionStatus("connected");

      if (currentUserId) {
        socket.emit(SOCKET_EVENTS.userChanged, {
          userId: currentUserId,
        });
      }
    };

    const handleDisconnect = () => {
      boardStore.getState().setConnectionStatus("disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SOCKET_EVENTS.boardHydrated, applySnapshot);
    socket.on(SOCKET_EVENTS.taskCreated, applyMutation);
    socket.on(SOCKET_EVENTS.taskUpdated, applyMutation);
    socket.on(SOCKET_EVENTS.taskMoved, applyMutation);
    socket.on(SOCKET_EVENTS.taskReordered, applyMutation);
    socket.on(SOCKET_EVENTS.taskDeleted, applyMutation);
    socket.on(SOCKET_EVENTS.presenceUpdated, applyPresence);

    boardStore.getState().setConnectionStatus(
      socket.connected ? "connected" : "connecting",
    );

    if (!socket.connected) {
      socket.connect();
    } else if (currentUserId) {
      socket.emit(SOCKET_EVENTS.userChanged, {
        userId: currentUserId,
      });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SOCKET_EVENTS.boardHydrated, applySnapshot);
      socket.off(SOCKET_EVENTS.taskCreated, applyMutation);
      socket.off(SOCKET_EVENTS.taskUpdated, applyMutation);
      socket.off(SOCKET_EVENTS.taskMoved, applyMutation);
      socket.off(SOCKET_EVENTS.taskReordered, applyMutation);
      socket.off(SOCKET_EVENTS.taskDeleted, applyMutation);
      socket.off(SOCKET_EVENTS.presenceUpdated, applyPresence);
    };
  }, [boardStore, currentUserId]);

  useEffect(() => {
    const socket = getSocketClient();

    if (socket.connected && currentUserId) {
      socket.emit(SOCKET_EVENTS.userChanged, {
        userId: currentUserId,
      });
    }
  }, [currentUserId]);
}
