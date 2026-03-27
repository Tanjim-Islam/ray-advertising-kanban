import type { TaskMutationResponse } from "@/features/tasks/types/api";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { BOARD_REALTIME_EVENT, getBoardRealtimeChannel } from "@/lib/supabase/events";
import { runtimeRealtimeSchema } from "@/lib/utils/env";
import { logger } from "@/lib/utils/logger";

export async function broadcastTaskMutation(payload: TaskMutationResponse) {
  const supabase = getSupabaseServerClient();
  const channel = supabase.channel(getBoardRealtimeChannel(runtimeRealtimeSchema));

  try {
    const result = await channel.httpSend(BOARD_REALTIME_EVENT, payload);

    if (!result.success) {
      logger.warn("Supabase board broadcast did not return success.", { result });
    }
  } finally {
    await supabase.removeChannel(channel);
  }
}
