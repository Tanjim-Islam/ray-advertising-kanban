import type { MoveTaskInput } from "@/lib/validations/task";
import type { TaskMutationResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function moveTaskRequest(input: MoveTaskInput) {
  return requestJson<TaskMutationResponse>("/api/tasks/move", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
