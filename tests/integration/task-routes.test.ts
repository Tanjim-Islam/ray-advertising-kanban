import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getBoard } from "@/app/api/board/route";
import { PATCH } from "@/app/api/tasks/[id]/route";
import { POST as createTaskRoute } from "@/app/api/tasks/route";
import { POST as moveTaskRoute } from "@/app/api/tasks/move/route";
import { POST as reorderTaskRoute } from "@/app/api/tasks/reorder/route";
import { prisma } from "@/lib/db/prisma";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { disconnectDatabase, resetDatabase } from "../setup/test-db";

describe("task routes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    globalThis.__boardSocketServer = undefined;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates and updates a task while emitting realtime events", async () => {
    const emit = vi.fn();
    globalThis.__boardSocketServer = {
      emit,
    } as never;

    const actor = await prisma.user.findFirstOrThrow();

    const createResponse = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Create task",
          description: "Draft the task card.",
          status: "TODO",
          actorUserId: actor.id,
          clientRequestId: crypto.randomUUID(),
        }),
      }),
    );

    const created = (await createResponse.json()) as { task: { id: string; title: string } };

    expect(createResponse.status).toBe(201);
    expect(created.task.title).toBe("Create task");
    expect(emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.taskCreated,
      expect.objectContaining({
        task: expect.objectContaining({
          id: created.task.id,
        }),
      }),
    );

    const updateResponse = await PATCH(
      new Request(`http://localhost/api/tasks/${created.task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "Updated task",
          description: "Refined description.",
          actorUserId: actor.id,
        }),
      }),
      {
        params: Promise.resolve({
          id: created.task.id,
        }),
      },
    );

    const updated = (await updateResponse.json()) as { task: { title: string } };

    expect(updated.task.title).toBe("Updated task");
    expect(emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.taskUpdated,
      expect.objectContaining({
        task: expect.objectContaining({
          title: "Updated task",
        }),
      }),
    );
  });

  it("moves and reorders tasks with persisted ordering", async () => {
    const actor = await prisma.user.findFirstOrThrow();

    const createTask = async (title: string) => {
      const response = await createTaskRoute(
        new Request("http://localhost/api/tasks", {
          method: "POST",
          body: JSON.stringify({
            title,
            description: `${title} description`,
            status: "TODO",
            actorUserId: actor.id,
          }),
        }),
      );

      return (await response.json()) as { task: { id: string } };
    };

    const first = await createTask("First");
    await createTask("Second");
    const third = await createTask("Third");

    await moveTaskRoute(
      new Request("http://localhost/api/tasks/move", {
        method: "POST",
        body: JSON.stringify({
          taskId: first.task.id,
          toStatus: "IN_PROGRESS",
          toIndex: 0,
          actorUserId: actor.id,
        }),
      }),
    );

    await reorderTaskRoute(
      new Request("http://localhost/api/tasks/reorder", {
        method: "POST",
        body: JSON.stringify({
          taskId: third.task.id,
          status: "TODO",
          toIndex: 0,
          actorUserId: actor.id,
        }),
      }),
    );

    const boardResponse = await getBoard();
    const board = (await boardResponse.json()) as {
      snapshot: {
        columns: Array<{ id: string; tasks: Array<{ title: string }> }>;
      };
    };

    const todoColumn = board.snapshot.columns.find((column) => column.id === "TODO");
    const inProgressColumn = board.snapshot.columns.find(
      (column) => column.id === "IN_PROGRESS",
    );

    expect(todoColumn?.tasks.map((task) => task.title)).toEqual(["Third", "Second"]);
    expect(inProgressColumn?.tasks.map((task) => task.title)).toEqual(["First"]);
  });
});
