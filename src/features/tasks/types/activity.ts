import type { UserSummary } from "@/features/tasks/types/user";

export type ActivityType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_MOVED"
  | "TASK_REORDERED"
  | "TASK_DELETED";

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  taskId: string | null;
  message: string;
  createdAt: string;
  actor: UserSummary | null;
}
