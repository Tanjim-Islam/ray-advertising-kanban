import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
