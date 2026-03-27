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
  const preferredOrder = DEFAULT_USERS.map((user) => user.name);

  return users.sort((left, right) => {
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
