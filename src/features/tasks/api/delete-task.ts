import type { DeleteTaskInput } from "@/lib/validations/task";
import type { TaskMutationResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function deleteTaskRequest(taskId: string, input: DeleteTaskInput) {
  return requestJson<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "DELETE",
    body: JSON.stringify(input),
  });
}
