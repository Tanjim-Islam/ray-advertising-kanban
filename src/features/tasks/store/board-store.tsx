"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";

import {
  applyTaskCollection,
  prependActivity,
  replaceOptimisticTask,
  upsertTask,
} from "@/features/tasks/lib/task-utils";
import type { BoardSnapshot } from "@/features/tasks/types/board";
import type { TaskMutationPayload } from "@/lib/realtime/events";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

export interface BoardStoreSnapshot {
  activities: BoardStoreState["activities"];
  columns: BoardStoreState["columns"];
}

export interface BoardStoreState {
  activities: BoardSnapshot["activities"];
  columns: BoardSnapshot["columns"];
  connectionStatus: RealtimeStatus;
  isMutating: boolean;
  lastError: string | null;
  applyMutation: (payload: TaskMutationPayload) => void;
  replaceSnapshot: (snapshot: Pick<BoardSnapshot, "activities" | "columns">) => void;
  restoreBoard: (snapshot: BoardStoreSnapshot) => void;
  setConnectionStatus: (status: RealtimeStatus) => void;
  setIsMutating: (value: boolean) => void;
  setLastError: (message: string | null) => void;
  setOptimisticTask: (task: TaskMutationPayload["task"]) => void;
}

type BoardStoreApi = ReturnType<typeof createBoardStore>;

const BoardStoreContext = createContext<BoardStoreApi | null>(null);

function createInitialState(snapshot: BoardSnapshot) {
  return {
    columns: snapshot.columns,
    activities: snapshot.activities,
    connectionStatus: "connecting" as RealtimeStatus,
    isMutating: false,
    lastError: null,
  };
}

export function createBoardStore(snapshot: BoardSnapshot) {
  return createStore<BoardStoreState>()((set) => ({
    ...createInitialState(snapshot),
    setIsMutating: (value) => {
      set({
        isMutating: value,
      });
    },
    setLastError: (message) => {
      set({
        lastError: message,
      });
    },
    setConnectionStatus: (status) => {
      set({
        connectionStatus: status,
      });
    },
    setOptimisticTask: (task) => {
      set((state) => ({
        columns: upsertTask(state.columns, task),
      }));
    },
    restoreBoard: (snapshotState) => {
      set({
        columns: snapshotState.columns,
        activities: snapshotState.activities,
      });
    },
    replaceSnapshot: (nextSnapshot) => {
      set({
        columns: nextSnapshot.columns,
        activities: nextSnapshot.activities,
        lastError: null,
      });
    },
    applyMutation: (payload) => {
      set((state) => {
        const columnsAfterRequestMatch =
          payload.clientRequestId
            ? replaceOptimisticTask(
                state.columns,
                payload.clientRequestId,
                payload.task,
              )
            : state.columns;

        const columnsAfterTask = upsertTask(columnsAfterRequestMatch, payload.task);
        const nextColumns = payload.affectedTasks?.length
          ? applyTaskCollection(columnsAfterTask, payload.affectedTasks)
          : columnsAfterTask;

        return {
          columns: nextColumns,
          activities: prependActivity(state.activities, payload.activity),
          lastError: null,
        };
      });
    },
  }));
}

export function BoardStoreProvider({
  children,
  snapshot,
}: {
  children: ReactNode;
  snapshot: BoardSnapshot;
}) {
  const [store] = useState(() => createBoardStore(snapshot));

  return (
    <BoardStoreContext.Provider value={store}>
      {children}
    </BoardStoreContext.Provider>
  );
}

export function useBoardStore<T>(selector: (state: BoardStoreState) => T) {
  const store = useContext(BoardStoreContext);

  if (!store) {
    throw new Error("BoardStoreProvider is missing from the component tree.");
  }

  return useStore(store, selector);
}

export function useBoardStoreApi() {
  const store = useContext(BoardStoreContext);

  if (!store) {
    throw new Error("BoardStoreProvider is missing from the component tree.");
  }

  return store;
}

export function captureBoardStoreSnapshot(state: BoardStoreState): BoardStoreSnapshot {
  return {
    columns: state.columns.map((column) => ({
      ...column,
      tasks: [...column.tasks],
    })),
    activities: [...state.activities],
  };
}
