import { updateTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { emitSocketEvent } from "@/lib/realtime/socket-server";
import { updateTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateTaskSchema);
    const result = await updateTask(id, input);

    emitSocketEvent(SOCKET_EVENTS.taskUpdated, result);

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
