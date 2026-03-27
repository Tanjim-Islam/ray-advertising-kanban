import type { UpdateTaskInput } from "@/lib/validations/task";
import type { TaskMutationResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function updateTaskRequest(taskId: string, input: UpdateTaskInput) {
  return requestJson<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
