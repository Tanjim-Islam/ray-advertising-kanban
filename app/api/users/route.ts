import { jsonResponse, handleRouteError } from "@/lib/http/api-response";
import { getUsers } from "@/lib/db/queries/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getUsers();

    return jsonResponse({
      users,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
