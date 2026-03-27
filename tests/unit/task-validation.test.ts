import { describe, expect, it } from "vitest";

import { createTaskSchema, deleteTaskSchema } from "@/lib/validations/task";

describe("task validation", () => {
  it("rejects a title that is too short", () => {
    const result = createTaskSchema.safeParse({
      title: "Hi",
      description: "Valid description",
      status: "TODO",
      actorUserId: "user-1",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid create task payload", () => {
    const result = createTaskSchema.safeParse({
      title: "Ship task board",
      description: "Build the production-ready Kanban experience.",
      status: "TODO",
      actorUserId: "user-1",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid delete task payload", () => {
    const result = deleteTaskSchema.safeParse({
      actorUserId: "user-1",
    });

    expect(result.success).toBe(true);
  });
});
