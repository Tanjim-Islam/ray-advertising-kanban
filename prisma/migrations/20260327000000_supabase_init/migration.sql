-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM (
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_MOVED',
  'TASK_REORDERED',
  'TASK_DELETED'
);

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "color" TEXT NOT NULL,
  "initials" TEXT NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "TaskStatus" NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "taskId" TEXT,
  "userId" TEXT,
  "payload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "Task_status_order_idx" ON "Task"("status", "order");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Supabase grants for public read access when needed
DO $$
DECLARE
  schema_name text := current_schema();
BEGIN
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated', schema_name);
  EXECUTE format('GRANT SELECT ON TABLE %I.%I TO anon, authenticated', schema_name, 'User');
  EXECUTE format('GRANT SELECT ON TABLE %I.%I TO anon, authenticated', schema_name, 'Task');
  EXECUTE format('GRANT SELECT ON TABLE %I.%I TO anon, authenticated', schema_name, 'Activity');

  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, 'User');
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, 'Task');
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, 'Activity');

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = schema_name
      AND tablename = 'User'
      AND policyname = 'read_users'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR SELECT TO anon, authenticated USING (true)',
      'read_users',
      schema_name,
      'User'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = schema_name
      AND tablename = 'Task'
      AND policyname = 'read_tasks'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR SELECT TO anon, authenticated USING (true)',
      'read_tasks',
      schema_name,
      'Task'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = schema_name
      AND tablename = 'Activity'
      AND policyname = 'read_activities'
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR SELECT TO anon, authenticated USING (true)',
      'read_activities',
      schema_name,
      'Activity'
    );
  END IF;
END $$;
