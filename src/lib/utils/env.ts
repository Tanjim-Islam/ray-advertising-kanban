import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_DEFAULT_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_SCHEMA: z.string().min(1).default("public"),
});

const parsedServerEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SECRET_DEFAULT_KEY: process.env.SUPABASE_SECRET_DEFAULT_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_SCHEMA: process.env.SUPABASE_DB_SCHEMA,
});

const supabasePublishableKey =
  parsedServerEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  parsedServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServerKey =
  parsedServerEnv.SUPABASE_SECRET_DEFAULT_KEY ??
  parsedServerEnv.SUPABASE_SERVICE_ROLE_KEY ??
  supabasePublishableKey;

if (!supabaseServerKey) {
  throw new Error(
    "Set SUPABASE_SECRET_DEFAULT_KEY, SUPABASE_SERVICE_ROLE_KEY, or a Supabase publishable key.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const serverEnv = {
  ...parsedServerEnv,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  SUPABASE_SERVER_KEY: supabaseServerKey,
};

export const publicSupabaseConfig = {
  key: serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  url: serverEnv.NEXT_PUBLIC_SUPABASE_URL,
};

export const runtimeRealtimeSchema = serverEnv.SUPABASE_DB_SCHEMA;
