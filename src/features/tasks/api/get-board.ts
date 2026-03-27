import type { BoardResponse } from "@/features/tasks/types/api";

import { requestJson } from "@/features/tasks/api/request-json";

export async function getBoard() {
  return requestJson<BoardResponse>("/api/board", {
    cache: "no-store",
  });
}
