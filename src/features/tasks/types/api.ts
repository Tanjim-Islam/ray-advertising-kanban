import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { BoardSnapshot } from "@/features/tasks/types/board";
import type { TaskRecord } from "@/features/tasks/types/task";

export interface BoardResponse {
  snapshot: BoardSnapshot;
}

export interface TaskMutationResponse {
  activity: ActivityRecord;
  affectedTasks?: TaskRecord[];
  clientRequestId?: string | null;
  deletedTaskId?: string | null;
  task?: TaskRecord;
}
