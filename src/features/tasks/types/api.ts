import type { TaskMutationPayload } from "@/lib/realtime/events";
import type { BoardSnapshot } from "@/features/tasks/types/board";

export interface BoardResponse {
  snapshot: BoardSnapshot;
}

export type TaskMutationResponse = TaskMutationPayload;
