import { spawn } from "node:child_process";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function withSchema(connectionString: string, schema: string) {
  const url = new URL(connectionString);

  url.searchParams.set("schema", schema);

  return url.toString();
}

const [schemaArg, ...command] = process.argv.slice(2);

if (!schemaArg || command.length === 0) {
  console.error(
    "Usage: tsx scripts/with-db-schema-env.ts <schema> <command> [...args]",
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  console.error("DATABASE_URL and DIRECT_URL must be set before running this script.");
  process.exit(1);
}

const schema = schemaArg === "app"
  ? process.env.SUPABASE_DB_SCHEMA ?? "public"
  : schemaArg;

const child = spawn(command[0]!, command.slice(1), {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: withSchema(databaseUrl, schema),
    DIRECT_URL: withSchema(directUrl, schema),
    SUPABASE_DB_SCHEMA: schema,
  },
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
