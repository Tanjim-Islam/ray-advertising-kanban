import { type User } from "@prisma/client";

import { mapUserToSummary } from "@/features/tasks/lib/task-mappers";
import { prisma } from "@/lib/db/prisma";
import { sortUsersByDefaultOrder } from "@/lib/db/seed";
import { ApiError } from "@/lib/http/api-response";

export async function listUsers() {
  const users = await prisma.user.findMany();

  return sortUsersByDefaultOrder(users);
}

export async function getUsers() {
  const users = await listUsers();

  return users.map(mapUserToSummary);
}

export async function getUserByIdOrThrow(
  userId: string,
  fetcher: {
    user: {
      findUnique(args: { where: { id: string } }): Promise<User | null>;
    };
  },
) {
  const user = await fetcher.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "The selected user could not be found.");
  }

  return user;
}
