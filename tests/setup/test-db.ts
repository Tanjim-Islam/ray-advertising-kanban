import { prisma } from "@/lib/db/prisma";
import { ensureDefaultUsers } from "@/lib/db/seed";

export async function resetDatabase() {
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await ensureDefaultUsers();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
