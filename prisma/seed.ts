import { PrismaClient } from "@prisma/client";

import { ensureDefaultUsers } from "../src/lib/db/seed";

const prisma = new PrismaClient();

async function main() {
  await ensureDefaultUsers(prisma);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
