import { jsonResponse, handleRouteError } from "@/lib/http/api-response";
import { getBoardSnapshot } from "@/lib/db/queries/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getBoardSnapshot();

    return jsonResponse({
      snapshot,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
