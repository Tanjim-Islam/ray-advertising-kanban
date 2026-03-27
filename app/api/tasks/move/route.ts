import { moveTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { broadcastTaskMutation } from "@/lib/supabase/broadcast";
import { logger } from "@/lib/utils/logger";
import { moveTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, moveTaskSchema);
    const result = await moveTask(input);

    try {
      await broadcastTaskMutation(result);
    } catch (error) {
      logger.warn("Failed to broadcast moved task mutation.", error);
    }

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
