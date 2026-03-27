import type { UserSummary } from "@/features/tasks/types/user";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary | null;
  updatedBy: UserSummary | null;
  optimistic?: boolean;
  clientRequestId?: string | null;
}
