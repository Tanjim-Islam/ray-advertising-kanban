import { describe, expect, it } from "vitest";

import { applyTaskMove, resolveTaskMoveIntent } from "@/features/tasks/lib/reorder";
import { createBoardColumns } from "@/features/tasks/lib/task-utils";
import type { TaskRecord } from "@/features/tasks/types/task";

const baseTask = (overrides: Partial<TaskRecord>): TaskRecord => ({
  id: crypto.randomUUID(),
  title: "Task",
  description: "Description",
  status: "TODO",
  order: 1_000,
  createdAt: "2026-03-26T00:00:00.000Z",
  updatedAt: "2026-03-26T00:00:00.000Z",
  createdBy: null,
  updatedBy: null,
  ...overrides,
});

describe("reorder utilities", () => {
  it("resolves a same-column reorder intent", () => {
    const columns = createBoardColumns([
      baseTask({ id: "a", title: "A", order: 1_000 }),
      baseTask({ id: "b", title: "B", order: 2_000 }),
    ]);

    expect(resolveTaskMoveIntent(columns, "a", "b")).toEqual({
      taskId: "a",
      fromStatus: "TODO",
      fromIndex: 0,
      toStatus: "TODO",
      toIndex: 1,
    });
  });

  it("moves a task across columns", () => {
    const columns = createBoardColumns([
      baseTask({ id: "a", title: "A", status: "TODO", order: 1_000 }),
      baseTask({ id: "b", title: "B", status: "IN_PROGRESS", order: 1_000 }),
    ]);

    const nextColumns = applyTaskMove(columns, {
      taskId: "a",
      fromStatus: "TODO",
      fromIndex: 0,
      toStatus: "IN_PROGRESS",
      toIndex: 1,
    });

    expect(nextColumns[0]?.tasks).toHaveLength(0);
    expect(nextColumns[1]?.tasks.map((task) => task.id)).toEqual(["b", "a"]);
    expect(nextColumns[1]?.tasks[1]?.status).toBe("IN_PROGRESS");
  });
});
