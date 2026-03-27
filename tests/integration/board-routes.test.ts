import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/board/route";
import { disconnectDatabase, resetDatabase } from "../setup/test-db";

describe("board route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns three fixed columns and seeded users", async () => {
    const response = await GET();
    const payload = (await response.json()) as {
      snapshot: {
        columns: Array<{ id: string; tasks: unknown[] }>;
        users: Array<{ id: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.snapshot.columns.map((column) => column.id)).toEqual([
      "TODO",
      "IN_PROGRESS",
      "DONE",
    ]);
    expect(payload.snapshot.users).toHaveLength(3);
    expect(payload.snapshot.columns.every((column) => Array.isArray(column.tasks))).toBe(
      true,
    );
  });
});
