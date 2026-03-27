import { ActivityType, type Prisma, type Task, type TaskStatus } from "@prisma/client";

import { mapActivityToRecord, mapTaskToRecord } from "@/features/tasks/lib/task-mappers";
import { ORDER_INCREMENT } from "@/features/tasks/lib/task-utils";
import type {
  CreateTaskInput,
  DeleteTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  UpdateTaskInput,
} from "@/lib/validations/task";
import { getUserByIdOrThrow } from "@/lib/db/queries/users";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-response";

function clampIndex(value: number, length: number) {
  return Math.min(Math.max(value, 0), length);
}

async function getTaskOrThrow(
  client: Prisma.TransactionClient,
  taskId: string,
) {
  const task = await client.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new ApiError(404, "The selected task could not be found.");
  }

  return task;
}

async function createActivity(
  client: Prisma.TransactionClient,
  params: {
    payload: Record<string, string>;
    taskId?: string | null;
    type: ActivityType;
    userId: string;
  },
) {
  return client.activity.create({
    data: {
      type: params.type,
      taskId: params.taskId ?? null,
      userId: params.userId,
      payload: JSON.stringify(params.payload),
    },
    include: {
      user: true,
    },
  });
}

async function hydrateTasksForStatuses(
  client: Prisma.TransactionClient,
  statuses: TaskStatus[],
) {
  return client.task.findMany({
    where: {
      status: {
        in: statuses,
      },
    },
    orderBy: [{ status: "asc" }, { order: "asc" }],
    include: {
      createdBy: true,
      updatedBy: true,
    },
  });
}

async function persistColumnLayout(
  client: Prisma.TransactionClient,
  params: {
    actorUserId: string;
    activeTaskId?: string;
    status: TaskStatus;
    tasks: Task[];
  },
) {
  const updates = params.tasks.flatMap((task, index) => {
    const nextOrder = (index + 1) * ORDER_INCREMENT;
    const shouldUpdate =
      task.order !== nextOrder ||
      task.status !== params.status ||
      task.id === params.activeTaskId;

    if (!shouldUpdate) {
      return [];
    }

    return [
      client.task.update({
        where: {
          id: task.id,
        },
        data: {
          order: nextOrder,
          status: params.status,
          ...(task.id === params.activeTaskId
            ? {
                updatedByUserId: params.actorUserId,
              }
            : {}),
        },
      }),
    ];
  });

  await Promise.all(updates);
}

export async function createTask(input: CreateTaskInput) {
  return prisma.$transaction(async (client) => {
    await getUserByIdOrThrow(input.actorUserId, client);

    const lastTask = await client.task.findFirst({
      where: {
        status: input.status,
      },
      orderBy: {
        order: "desc",
      },
    });

    const task = await client.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        order: (lastTask?.order ?? 0) + ORDER_INCREMENT,
        createdByUserId: input.actorUserId,
        updatedByUserId: input.actorUserId,
      },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });

    const activity = await createActivity(client, {
      type: ActivityType.TASK_CREATED,
      taskId: task.id,
      userId: input.actorUserId,
      payload: {
        status: task.status,
        title: task.title,
      },
    });

    return {
      task: mapTaskToRecord(task),
      activity: mapActivityToRecord(activity),
      clientRequestId: input.clientRequestId ?? null,
    };
  });
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  return prisma.$transaction(async (client) => {
    await getUserByIdOrThrow(input.actorUserId, client);
    await getTaskOrThrow(client, taskId);

    const task = await client.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: input.title,
        description: input.description,
        updatedByUserId: input.actorUserId,
      },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });

    const activity = await createActivity(client, {
      type: ActivityType.TASK_UPDATED,
      taskId: task.id,
      userId: input.actorUserId,
      payload: {
        status: task.status,
        title: task.title,
      },
    });

    return {
      task: mapTaskToRecord(task),
      activity: mapActivityToRecord(activity),
    };
  });
}

export async function moveTask(input: MoveTaskInput) {
  return prisma.$transaction(async (client) => {
    await getUserByIdOrThrow(input.actorUserId, client);

    const task = await getTaskOrThrow(client, input.taskId);

    const [sourceTasks, destinationTasks] = await Promise.all([
      client.task.findMany({
        where: {
          status: task.status,
        },
        orderBy: {
          order: "asc",
        },
      }),
      client.task.findMany({
        where: {
          status: input.toStatus,
        },
        orderBy: {
          order: "asc",
        },
      }),
    ]);

    const sourceIndex = sourceTasks.findIndex((value) => value.id === task.id);

    if (sourceIndex < 0) {
      throw new ApiError(404, "The selected task could not be found.");
    }

    sourceTasks.splice(sourceIndex, 1);

    const destinationIndex = clampIndex(input.toIndex, destinationTasks.length);
    destinationTasks.splice(destinationIndex, 0, {
      ...task,
      status: input.toStatus,
    });

    await persistColumnLayout(client, {
      tasks: sourceTasks,
      status: task.status,
      actorUserId: input.actorUserId,
    });

    await persistColumnLayout(client, {
      tasks: destinationTasks,
      status: input.toStatus,
      actorUserId: input.actorUserId,
      activeTaskId: task.id,
    });

    const [activity, affectedTasks, hydratedTask] = await Promise.all([
      createActivity(client, {
        type: ActivityType.TASK_MOVED,
        taskId: task.id,
        userId: input.actorUserId,
        payload: {
          fromStatus: task.status,
          title: task.title,
          toStatus: input.toStatus,
        },
      }),
      hydrateTasksForStatuses(client, [task.status, input.toStatus]),
      client.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          createdBy: true,
          updatedBy: true,
        },
      }),
    ]);

    return {
      task: mapTaskToRecord(hydratedTask),
      activity: mapActivityToRecord(activity),
      affectedTasks: affectedTasks.map(mapTaskToRecord),
      clientRequestId: input.clientRequestId ?? null,
    };
  });
}

export async function reorderTask(input: ReorderTaskInput) {
  return prisma.$transaction(async (client) => {
    await getUserByIdOrThrow(input.actorUserId, client);

    const task = await getTaskOrThrow(client, input.taskId);

    if (task.status !== input.status) {
      throw new ApiError(
        400,
        "The task is no longer in the requested column and should be refreshed.",
      );
    }

    const tasks = await client.task.findMany({
      where: {
        status: input.status,
      },
      orderBy: {
        order: "asc",
      },
    });

    const currentIndex = tasks.findIndex((value) => value.id === task.id);

    if (currentIndex < 0) {
      throw new ApiError(404, "The selected task could not be found.");
    }

    const [activeTask] = tasks.splice(currentIndex, 1);

    if (!activeTask) {
      throw new ApiError(404, "The selected task could not be found.");
    }

    const destinationIndex = clampIndex(input.toIndex, tasks.length);
    tasks.splice(destinationIndex, 0, activeTask);

    await persistColumnLayout(client, {
      tasks,
      status: input.status,
      actorUserId: input.actorUserId,
      activeTaskId: task.id,
    });

    const [activity, affectedTasks, hydratedTask] = await Promise.all([
      createActivity(client, {
        type: ActivityType.TASK_REORDERED,
        taskId: task.id,
        userId: input.actorUserId,
        payload: {
          status: input.status,
          title: task.title,
        },
      }),
      hydrateTasksForStatuses(client, [input.status]),
      client.task.findUniqueOrThrow({
        where: {
          id: task.id,
        },
        include: {
          createdBy: true,
          updatedBy: true,
        },
      }),
    ]);

    return {
      task: mapTaskToRecord(hydratedTask),
      activity: mapActivityToRecord(activity),
      affectedTasks: affectedTasks.map(mapTaskToRecord),
      clientRequestId: input.clientRequestId ?? null,
    };
  });
}

export async function deleteTask(taskId: string, input: DeleteTaskInput) {
  return prisma.$transaction(async (client) => {
    await getUserByIdOrThrow(input.actorUserId, client);

    const task = await getTaskOrThrow(client, taskId);
    const remainingTasks = await client.task.findMany({
      where: {
        status: task.status,
      },
      orderBy: {
        order: "asc",
      },
    });

    const filteredTasks = remainingTasks.filter((value) => value.id !== task.id);

    await client.task.delete({
      where: {
        id: task.id,
      },
    });

    await persistColumnLayout(client, {
      tasks: filteredTasks,
      status: task.status,
      actorUserId: input.actorUserId,
    });

    const [activity, affectedTasks] = await Promise.all([
      createActivity(client, {
        type: ActivityType.TASK_DELETED,
        userId: input.actorUserId,
        payload: {
          status: task.status,
          title: task.title,
        },
      }),
      hydrateTasksForStatuses(client, [task.status]),
    ]);

    return {
      deletedTaskId: task.id,
      activity: mapActivityToRecord(activity),
      affectedTasks: affectedTasks.map(mapTaskToRecord),
    };
  });
}
