"use client";

import { createTaskRequest } from "@/features/tasks/api/create-task";
import { deleteTaskRequest } from "@/features/tasks/api/delete-task";
import { moveTaskRequest } from "@/features/tasks/api/move-task";
import { reorderTaskRequest } from "@/features/tasks/api/reorder-task";
import { updateTaskRequest } from "@/features/tasks/api/update-task";
import { applyTaskMove } from "@/features/tasks/lib/reorder";
import { captureBoardStoreSnapshot, useBoardStoreApi } from "@/features/tasks/store/board-store";
import { useCurrentUser } from "@/features/tasks/store/user-store";
import type { TaskStatus } from "@/features/tasks/types/task";
import { findTaskLocation, removeTask } from "@/features/tasks/lib/task-utils";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "The request could not be completed.";
}

export function useTaskActions() {
  const boardStore = useBoardStoreApi();
  const currentUser = useCurrentUser();

  async function withRollback(
    run: () => Promise<void>,
  ) {
    const snapshot = captureBoardStoreSnapshot(boardStore.getState());

    boardStore.getState().setIsMutating(true);
    boardStore.getState().setLastError(null);

    try {
      await run();
    } catch (error) {
      boardStore.getState().restoreBoard(snapshot);
      boardStore.getState().setLastError(getErrorMessage(error));
      throw error;
    } finally {
      boardStore.getState().setIsMutating(false);
    }
  }

  async function createTask(params: {
    description: string;
    status: TaskStatus;
    title: string;
  }) {
    if (!currentUser) {
      throw new Error("Select a simulated teammate before creating a task.");
    }

    const snapshot = captureBoardStoreSnapshot(boardStore.getState());
    const clientRequestId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    boardStore.getState().setIsMutating(true);
    boardStore.getState().setLastError(null);
    boardStore.getState().setOptimisticTask({
      id: `optimistic-${clientRequestId}`,
      title: params.title,
      description: params.description,
      status: params.status,
      order: Date.now(),
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: currentUser,
      updatedBy: currentUser,
      optimistic: true,
      clientRequestId,
    });

    try {
      const result = await createTaskRequest({
        title: params.title,
        description: params.description,
        status: params.status,
        actorUserId: currentUser.id,
        clientRequestId,
      });
      const persistedTask = result.task;

      if (!persistedTask) {
        throw new Error("The created task response was incomplete.");
      }

      boardStore.getState().applyMutation({
        ...result,
        task: {
          ...persistedTask,
          clientRequestId,
        },
      });

      return;
    } catch (error) {
      boardStore.getState().restoreBoard(snapshot);
      boardStore.getState().setLastError(getErrorMessage(error));
      throw error;
    } finally {
      boardStore.getState().setIsMutating(false);
    }
  }

  async function updateTask(params: {
    description: string;
    taskId: string;
    title: string;
  }) {
    if (!currentUser) {
      throw new Error("Select a simulated teammate before updating a task.");
    }

    return withRollback(async () => {
      const location = findTaskLocation(
        boardStore.getState().columns,
        params.taskId,
      );

      if (!location?.task) {
        throw new Error("The selected task could not be found.");
      }

      boardStore.getState().setOptimisticTask({
        ...location.task,
        title: params.title,
        description: params.description,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser,
      });

      const result = await updateTaskRequest(params.taskId, {
        title: params.title,
        description: params.description,
        actorUserId: currentUser.id,
      });

      boardStore.getState().applyMutation(result);
    });
  }

  async function moveTask(params: {
    taskId: string;
    toIndex: number;
    toStatus: TaskStatus;
  }) {
    if (!currentUser) {
      throw new Error("Select a simulated teammate before moving a task.");
    }

    return withRollback(async () => {
      const location = findTaskLocation(
        boardStore.getState().columns,
        params.taskId,
      );

      if (!location) {
        throw new Error("The selected task could not be found.");
      }

      boardStore.getState().replaceSnapshot({
        columns: applyTaskMove(boardStore.getState().columns, {
          taskId: params.taskId,
          fromStatus: location.column.id,
          fromIndex: location.taskIndex,
          toStatus: params.toStatus,
          toIndex: params.toIndex,
        }),
        activities: boardStore.getState().activities,
      });

      const result = await moveTaskRequest({
        taskId: params.taskId,
        toStatus: params.toStatus,
        toIndex: params.toIndex,
        actorUserId: currentUser.id,
        clientRequestId: crypto.randomUUID(),
      });

      boardStore.getState().applyMutation(result);
    });
  }

  async function deleteTask(params: { taskId: string }) {
    if (!currentUser) {
      throw new Error("Select a simulated teammate before deleting a task.");
    }

    return withRollback(async () => {
      const location = findTaskLocation(
        boardStore.getState().columns,
        params.taskId,
      );

      if (!location) {
        throw new Error("The selected task could not be found.");
      }

      boardStore.getState().replaceSnapshot({
        columns: removeTask(boardStore.getState().columns, params.taskId),
        activities: boardStore.getState().activities,
      });

      const result = await deleteTaskRequest(params.taskId, {
        actorUserId: currentUser.id,
      });

      boardStore.getState().applyMutation(result);
    });
  }

  async function reorderTask(params: {
    status: TaskStatus;
    taskId: string;
    toIndex: number;
  }) {
    if (!currentUser) {
      throw new Error("Select a simulated teammate before reordering a task.");
    }

    return withRollback(async () => {
      const location = findTaskLocation(
        boardStore.getState().columns,
        params.taskId,
      );

      if (!location) {
        throw new Error("The selected task could not be found.");
      }

      boardStore.getState().replaceSnapshot({
        columns: applyTaskMove(boardStore.getState().columns, {
          taskId: params.taskId,
          fromStatus: location.column.id,
          fromIndex: location.taskIndex,
          toStatus: params.status,
          toIndex: params.toIndex,
        }),
        activities: boardStore.getState().activities,
      });

      const result = await reorderTaskRequest({
        taskId: params.taskId,
        status: params.status,
        toIndex: params.toIndex,
        actorUserId: currentUser.id,
        clientRequestId: crypto.randomUUID(),
      });

      boardStore.getState().applyMutation(result);
    });
  }

  return {
    createTask,
    deleteTask,
    moveTask,
    reorderTask,
    updateTask,
  };
}
