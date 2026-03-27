import { createTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { broadcastTaskMutation } from "@/lib/supabase/broadcast";
import { logger } from "@/lib/utils/logger";
import { createTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, createTaskSchema);
    const result = await createTask(input);

    try {
      await broadcastTaskMutation(result);
    } catch (error) {
      logger.warn("Failed to broadcast created task mutation.", error);
    }

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
