import type { CreateTaskInput } from "@/lib/validations/task";
import type { TaskMutationResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function createTaskRequest(input: CreateTaskInput) {
  return requestJson<TaskMutationResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
