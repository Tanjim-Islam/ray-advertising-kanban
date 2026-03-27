import { reorderTask } from "@/lib/db/mutations/tasks";
import { handleRouteError, jsonResponse, parseJsonBody } from "@/lib/http/api-response";
import { broadcastTaskMutation } from "@/lib/supabase/broadcast";
import { logger } from "@/lib/utils/logger";
import { reorderTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, reorderTaskSchema);
    const result = await reorderTask(input);

    try {
      await broadcastTaskMutation(result);
    } catch (error) {
      logger.warn("Failed to broadcast reordered task mutation.", error);
    }

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
