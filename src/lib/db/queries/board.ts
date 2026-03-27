import { mapBoardSnapshot } from "@/features/tasks/lib/task-mappers";
import { prisma } from "@/lib/db/prisma";
import { ensureDefaultUsers } from "@/lib/db/seed";

export async function getBoardSnapshot() {
  const users = await ensureDefaultUsers();

  const [tasks, activities] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ status: "asc" }, { order: "asc" }],
      include: {
        createdBy: true,
        updatedBy: true,
      },
    }),
    prisma.activity.findMany({
      take: 12,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
      },
    }),
  ]);

  return mapBoardSnapshot({
    tasks,
    activities,
    users,
  });
}
