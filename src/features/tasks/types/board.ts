import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task";
import type { UserSummary } from "@/features/tasks/types/user";

export interface BoardColumn {
  id: TaskStatus;
  title: string;
  description: string;
  accent: string;
  tasks: TaskRecord[];
}

export interface BoardSnapshot {
  columns: BoardColumn[];
  activities: ActivityRecord[];
  users: UserSummary[];
}
