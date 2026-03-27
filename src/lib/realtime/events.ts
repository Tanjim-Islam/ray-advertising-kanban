import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { BoardSnapshot } from "@/features/tasks/types/board";
import type { TaskRecord } from "@/features/tasks/types/task";

export const SOCKET_EVENTS = {
  boardHydrated: "board:hydrated",
  taskCreated: "task:created",
  taskUpdated: "task:updated",
  taskMoved: "task:moved",
  taskReordered: "task:reordered",
  userChanged: "user:changed",
  presenceUpdated: "presence:updated",
} as const;

export interface BoardHydratedPayload {
  snapshot: BoardSnapshot;
}

export interface PresenceUpdatedPayload {
  onlineUserIds: string[];
}

export interface TaskMutationPayload {
  task: TaskRecord;
  activity: ActivityRecord;
  affectedTasks?: TaskRecord[];
  clientRequestId?: string | null;
}

export interface UserChangedPayload {
  userId: string;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.boardHydrated]: (payload: BoardHydratedPayload) => void;
  [SOCKET_EVENTS.taskCreated]: (payload: TaskMutationPayload) => void;
  [SOCKET_EVENTS.taskUpdated]: (payload: TaskMutationPayload) => void;
  [SOCKET_EVENTS.taskMoved]: (payload: TaskMutationPayload) => void;
  [SOCKET_EVENTS.taskReordered]: (payload: TaskMutationPayload) => void;
  [SOCKET_EVENTS.presenceUpdated]: (payload: PresenceUpdatedPayload) => void;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.userChanged]: (payload: UserChangedPayload) => void;
}
