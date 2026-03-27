import type { ReorderTaskInput } from "@/lib/validations/task";
import type { TaskMutationResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function reorderTaskRequest(input: ReorderTaskInput) {
  return requestJson<TaskMutationResponse>("/api/tasks/reorder", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
