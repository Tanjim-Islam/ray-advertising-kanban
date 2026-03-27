"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { startTransition, useEffect, useEffectEvent, useRef } from "react";

import { getBoard } from "@/features/tasks/api/get-board";
import type { TaskMutationResponse } from "@/features/tasks/types/api";
import { useBoardStoreApi } from "@/features/tasks/store/board-store";
import { useUserStore, useUserStoreApi } from "@/features/tasks/store/user-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  BOARD_REALTIME_EVENT,
  getBoardRealtimeChannel,
} from "@/lib/supabase/events";

function collectOnlineUserIds(channel: RealtimeChannel) {
  const presenceState = channel.presenceState<{ userId?: string }>();

  return [...new Set(
    Object.values(presenceState)
      .flat()
      .map((presence) => presence.userId)
      .filter((value): value is string => Boolean(value)),
  )];
}

export function useBoardRealtime({ schema }: { schema: string }) {
  const boardStore = useBoardStoreApi();
  const userStore = useUserStoreApi();
  const currentUserId = useUserStore((state) => state.currentUserId);
  const presenceKeyRef = useRef(`presence-${crypto.randomUUID()}`);

  const applySnapshot = useEffectEvent(
    (snapshot: Awaited<ReturnType<typeof getBoard>>["snapshot"]) => {
      startTransition(() => {
        boardStore.getState().replaceSnapshot(snapshot);
        userStore.getState().setUsers(snapshot.users);
      });
    },
  );

  const refreshSnapshot = useEffectEvent(async () => {
    const response = await getBoard();
    applySnapshot(response.snapshot);
  });

  const syncPresence = useEffectEvent((channel: RealtimeChannel) => {
    userStore.getState().setOnlineUserIds(collectOnlineUserIds(channel));
  });

  const applyRealtimeMutation = useEffectEvent((payload: TaskMutationResponse) => {
    startTransition(() => {
      boardStore.getState().applyMutation(payload);
    });
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(getBoardRealtimeChannel(schema), {
      config: {
        presence: {
          key: presenceKeyRef.current,
        },
      },
    });

    boardStore.getState().setConnectionStatus("connecting");

    channel
      .on(
        "broadcast",
        {
          event: BOARD_REALTIME_EVENT,
        },
        ({ payload }) => {
          applyRealtimeMutation(payload as TaskMutationResponse);
        },
      )
      .on("presence", { event: "sync" }, () => {
        syncPresence(channel);
      })
      .on("presence", { event: "join" }, () => {
        syncPresence(channel);
      })
      .on("presence", { event: "leave" }, () => {
        syncPresence(channel);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          boardStore.getState().setConnectionStatus("connected");

          if (currentUserId) {
            await channel.track({
              userId: currentUserId,
            });
          } else {
            userStore.getState().setOnlineUserIds([]);
          }

          void refreshSnapshot().catch(() => undefined);
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          boardStore.getState().setConnectionStatus("disconnected");
          userStore.getState().setOnlineUserIds([]);
        }
      });

    return () => {
      userStore.getState().setOnlineUserIds([]);
      boardStore.getState().setConnectionStatus("connecting");
      void supabase.removeChannel(channel);
    };
  }, [boardStore, currentUserId, schema, userStore]);
}
