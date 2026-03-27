import type { UserSummary } from "@/features/tasks/types/user";

export type ActivityType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_MOVED"
  | "TASK_REORDERED";

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  taskId: string;
  message: string;
  createdAt: string;
  actor: UserSummary | null;
}
