import { moveTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { emitSocketEvent } from "@/lib/realtime/socket-server";
import { moveTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, moveTaskSchema);
    const result = await moveTask(input);

    emitSocketEvent(SOCKET_EVENTS.taskMoved, result);

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
