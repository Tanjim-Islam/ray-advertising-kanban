import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { GET as getBoard } from "@/app/api/board/route";
import { DELETE, PATCH } from "@/app/api/tasks/[id]/route";
import { POST as createTaskRoute } from "@/app/api/tasks/route";
import { POST as moveTaskRoute } from "@/app/api/tasks/move/route";
import { POST as reorderTaskRoute } from "@/app/api/tasks/reorder/route";
import { prisma } from "@/lib/db/prisma";
import { disconnectDatabase, resetDatabase } from "../setup/test-db";

describe("task routes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates and updates a task with persisted activity", async () => {
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
    const persistedTask = await prisma.task.findUniqueOrThrow({
      where: {
        id: created.task.id,
      },
    });
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(updated.task.title).toBe("Updated task");
    expect(persistedTask.title).toBe("Updated task");
    expect(activities.map((activity) => activity.type)).toEqual([
      "TASK_CREATED",
      "TASK_UPDATED",
    ]);
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

  it("deletes a task and persists delete activity", async () => {
    const actor = await prisma.user.findFirstOrThrow();

    const createResponse = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Disposable task",
          description: "Remove me cleanly.",
          status: "TODO",
          actorUserId: actor.id,
        }),
      }),
    );

    const created = (await createResponse.json()) as { task: { id: string } };

    const deleteResponse = await DELETE(
      new Request(`http://localhost/api/tasks/${created.task.id}`, {
        method: "DELETE",
        body: JSON.stringify({
          actorUserId: actor.id,
        }),
      }),
      {
        params: Promise.resolve({
          id: created.task.id,
        }),
      },
    );

    const deleted = (await deleteResponse.json()) as {
      activity: { message: string; type: string };
      deletedTaskId: string;
    };

    expect(deleteResponse.status).toBe(200);
    expect(deleted.deletedTaskId).toBe(created.task.id);
    expect(deleted.activity.type).toBe("TASK_DELETED");
    expect(deleted.activity.message).toContain("deleted");

    const deletedTask = await prisma.task.findUnique({
      where: {
        id: created.task.id,
      },
    });
    const persistedDeleteActivity = await prisma.activity.findFirst({
      where: {
        type: "TASK_DELETED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(deletedTask).toBeNull();
    expect(persistedDeleteActivity?.taskId).toBeNull();
  });
});
