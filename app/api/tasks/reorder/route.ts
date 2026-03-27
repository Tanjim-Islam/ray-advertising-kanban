import { reorderTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { emitSocketEvent } from "@/lib/realtime/socket-server";
import { reorderTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, reorderTaskSchema);
    const result = await reorderTask(input);

    emitSocketEvent(SOCKET_EVENTS.taskReordered, result);

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
