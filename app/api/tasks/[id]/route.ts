import { deleteTask, updateTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { broadcastTaskMutation } from "@/lib/supabase/broadcast";
import { logger } from "@/lib/utils/logger";
import { deleteTaskSchema, updateTaskSchema } from "@/lib/validations/task";

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

    try {
      await broadcastTaskMutation(result);
    } catch (error) {
      logger.warn("Failed to broadcast updated task mutation.", error);
    }

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = await parseJsonBody(request, deleteTaskSchema);
    const result = await deleteTask(id, input);

    try {
      await broadcastTaskMutation(result);
    } catch (error) {
      logger.warn("Failed to broadcast deleted task mutation.", error);
    }

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
