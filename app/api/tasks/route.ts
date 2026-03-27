import { createTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { emitSocketEvent } from "@/lib/realtime/socket-server";
import { createTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, createTaskSchema);
    const result = await createTask(input);

    emitSocketEvent(SOCKET_EVENTS.taskCreated, result);

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
