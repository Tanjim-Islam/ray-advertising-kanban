import { ActivityType, type TaskStatus } from "@prisma/client";

import { ORDER_INCREMENT } from "@/features/tasks/lib/task-utils";
import type { DatabaseClient } from "@/lib/db/prisma";
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_USERS = [
  {
    name: "Tanjim",
    role: "Product Lead",
    color: "#0f766e",
    initials: "T",
  },
  {
    name: "Ifad",
    role: "Frontend Engineer",
    color: "#b45309",
    initials: "I",
  },
  {
    name: "Abrar",
    role: "QA Analyst",
    color: "#1d4ed8",
    initials: "A",
  },
] as const;

const LEGACY_NAME_MAP: Record<string, (typeof DEFAULT_USERS)[number]> = {
  "Ava Palmer": DEFAULT_USERS[0],
  "Ivy Chen": DEFAULT_USERS[1],
  "Noah Brooks": DEFAULT_USERS[2],
};

const DEFAULT_TASKS = [
  {
    title: "Design system audit",
    description: "Review typography, spacing, and color tokens across all components.",
    status: "TODO" as TaskStatus,
    assigneeName: "Ifad",
  },
  {
    title: "Activity feed polish",
    description: "Refine motion timing and improve readability in the activity rail.",
    status: "IN_PROGRESS" as TaskStatus,
    assigneeName: "Abrar",
  },
  {
    title: "API integration",
    description: "Connect the board UI to the production-ready task endpoints.",
    status: "DONE" as TaskStatus,
    assigneeName: "Tanjim",
  },
] as const;

export function sortUsersByDefaultOrder<T extends { name: string }>(users: T[]) {
  const preferredOrder = DEFAULT_USERS.map((user) => user.name);

  return [...users].sort((left, right) => {
    const leftIndex = preferredOrder.findIndex((name) => name === left.name);
    const rightIndex = preferredOrder.findIndex((name) => name === right.name);

    if (leftIndex >= 0 && rightIndex >= 0) {
      return leftIndex - rightIndex;
    }

    if (leftIndex >= 0) {
      return -1;
    }

    if (rightIndex >= 0) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export async function ensureDefaultUsers(client: DatabaseClient = prisma) {
  const existingUsers = await client.user.findMany();

  for (const [legacyName, nextUser] of Object.entries(LEGACY_NAME_MAP)) {
    const renamedUser = existingUsers.find((user) => user.name === legacyName);
    const currentUser = existingUsers.find((user) => user.name === nextUser.name);

    if (renamedUser && !currentUser) {
      await client.user.update({
        where: {
          id: renamedUser.id,
        },
        data: {
          name: nextUser.name,
          role: nextUser.role,
          color: nextUser.color,
          initials: nextUser.initials,
        },
      });
    }
  }

  await Promise.all(
    DEFAULT_USERS.map((user) =>
      client.user.upsert({
        where: {
          name: user.name,
        },
        create: user,
        update: {
          role: user.role,
          color: user.color,
          initials: user.initials,
        },
      }),
    ),
  );

  const users = await client.user.findMany();

  return sortUsersByDefaultOrder(users);
}

export async function ensureSampleBoard(client: DatabaseClient = prisma) {
  const users = await ensureDefaultUsers(client);
  const existingTaskCount = await client.task.count();

  if (existingTaskCount > 0) {
    return;
  }

  for (const [index, task] of DEFAULT_TASKS.entries()) {
    const actor = users.find((user) => user.name === task.assigneeName) ?? users[0];

    if (!actor) {
      continue;
    }

    const createdTask = await client.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        order: (index + 1) * ORDER_INCREMENT,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
      },
    });

    await client.activity.create({
      data: {
        type: ActivityType.TASK_CREATED,
        taskId: createdTask.id,
        userId: actor.id,
        payload: JSON.stringify({
          status: task.status,
          title: task.title,
        }),
      },
    });
  }
}
