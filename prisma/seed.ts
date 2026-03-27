import { PrismaClient } from "@prisma/client";

import { ensureSampleBoard } from "../src/lib/db/seed";

const prisma = new PrismaClient();

async function main() {
  await ensureSampleBoard(prisma);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
