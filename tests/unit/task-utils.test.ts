import { describe, expect, it } from "vitest";

import {
  prependActivity,
  removeTask,
  replaceOptimisticTask,
} from "@/features/tasks/lib/task-utils";
import { createBoardColumns } from "@/features/tasks/lib/task-utils";
import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { TaskRecord } from "@/features/tasks/types/task";

const makeTask = (overrides: Partial<TaskRecord>): TaskRecord => ({
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

const makeActivity = (overrides: Partial<ActivityRecord>): ActivityRecord => ({
  id: crypto.randomUUID(),
  type: "TASK_CREATED",
  taskId: "task-1",
  message: "created a task.",
  createdAt: "2026-03-26T00:00:00.000Z",
  actor: null,
  ...overrides,
});

describe("task utilities", () => {
  it("replaces an optimistic task using a client request id", () => {
    const columns = createBoardColumns([
      makeTask({
        id: "temp-1",
        clientRequestId: "request-1",
        optimistic: true,
      }),
    ]);

    const nextColumns = replaceOptimisticTask(
      columns,
      "request-1",
      makeTask({
        id: "real-1",
        title: "Saved task",
      }),
    );

    expect(nextColumns[0]?.tasks.map((task) => task.id)).toEqual(["real-1"]);
  });

  it("prepends activities without duplicating the newest event", () => {
    const first = makeActivity({ id: "a" });
    const second = makeActivity({ id: "b" });

    expect(prependActivity([first], second)).toEqual([second, first]);
    expect(prependActivity([first], first)).toEqual([first]);
  });

  it("removes a task from every column copy without mutating the original input", () => {
    const columns = createBoardColumns([
      makeTask({ id: "task-a", title: "Task A" }),
      makeTask({ id: "task-b", title: "Task B", status: "IN_PROGRESS" }),
    ]);

    const nextColumns = removeTask(columns, "task-b");

    expect(nextColumns[1]?.tasks).toEqual([]);
    expect(columns[1]?.tasks.map((task) => task.id)).toEqual(["task-b"]);
  });
});
