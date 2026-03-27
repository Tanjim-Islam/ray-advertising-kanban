import {
  ActivityType,
  type Activity,
  type Prisma,
  type Task,
  type User,
} from "@prisma/client";

import { createBoardColumns, COLUMN_META } from "@/features/tasks/lib/task-utils";
import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { BoardSnapshot } from "@/features/tasks/types/board";
import type { TaskRecord } from "@/features/tasks/types/task";
import type { UserSummary } from "@/features/tasks/types/user";

export type TaskWithUsers = Prisma.TaskGetPayload<{
  include: {
    createdBy: true;
    updatedBy: true;
  };
}>;

export type ActivityWithUser = Prisma.ActivityGetPayload<{
  include: {
    user: true;
  };
}>;

interface ActivityPayload {
  fromStatus?: keyof typeof COLUMN_META;
  status?: keyof typeof COLUMN_META;
  title?: string;
  toStatus?: keyof typeof COLUMN_META;
}

function parseActivityPayload(payload: string): ActivityPayload {
  try {
    return JSON.parse(payload) as ActivityPayload;
  } catch {
    return {};
  }
}

function getStatusLabel(status?: keyof typeof COLUMN_META) {
  return status ? COLUMN_META[status].title : "the board";
}

function buildActivityMessage(type: ActivityType, payload: ActivityPayload) {
  const title = payload.title ? `“${payload.title}”` : "a task";

  switch (type) {
    case ActivityType.TASK_CREATED:
      return `created ${title} in ${getStatusLabel(payload.status)}.`;
    case ActivityType.TASK_UPDATED:
      return `updated ${title}.`;
    case ActivityType.TASK_MOVED:
      return `moved ${title} from ${getStatusLabel(payload.fromStatus)} to ${getStatusLabel(payload.toStatus)}.`;
    case ActivityType.TASK_REORDERED:
      return `reordered ${title} in ${getStatusLabel(payload.status)}.`;
    case ActivityType.TASK_DELETED:
      return `deleted ${title} from ${getStatusLabel(payload.status)}.`;
    default:
      return `updated ${title}.`;
  }
}

export function mapUserToSummary(user: User): UserSummary {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
    initials: user.initials,
  };
}

export function mapTaskToRecord(task: TaskWithUsers | Task): TaskRecord {
  const createdBy = "createdBy" in task && task.createdBy ? mapUserToSummary(task.createdBy) : null;
  const updatedBy = "updatedBy" in task && task.updatedBy ? mapUserToSummary(task.updatedBy) : null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    order: task.order,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    createdBy,
    updatedBy,
  };
}

export function mapActivityToRecord(activity: ActivityWithUser | Activity): ActivityRecord {
  const actor = "user" in activity && activity.user ? mapUserToSummary(activity.user) : null;
  const payload = parseActivityPayload(activity.payload);

  return {
    id: activity.id,
    type: activity.type,
    taskId: activity.taskId,
    message: buildActivityMessage(activity.type, payload),
    createdAt: activity.createdAt.toISOString(),
    actor,
  };
}

export function mapBoardSnapshot(params: {
  activities: ActivityWithUser[];
  tasks: TaskWithUsers[];
  users: User[];
}): BoardSnapshot {
  return {
    columns: createBoardColumns(params.tasks.map(mapTaskToRecord)),
    activities: params.activities.map(mapActivityToRecord),
    users: params.users.map(mapUserToSummary),
  };
}
