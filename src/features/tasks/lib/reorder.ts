import type { BoardColumn } from "@/features/tasks/types/board";
import type { TaskStatus } from "@/features/tasks/types/task";

import { BOARD_STATUS_ORDER, cloneColumns, findTaskLocation } from "@/features/tasks/lib/task-utils";

export interface TaskMoveIntent {
  taskId: string;
  fromStatus: TaskStatus;
  fromIndex: number;
  toStatus: TaskStatus;
  toIndex: number;
}

function isTaskStatus(value: string): value is TaskStatus {
  return BOARD_STATUS_ORDER.includes(value as TaskStatus);
}

function clampIndex(value: number, length: number) {
  return Math.min(Math.max(value, 0), length);
}

export function resolveTaskMoveIntent(
  columns: BoardColumn[],
  activeId: string,
  overId: string,
) {
  const activeLocation = findTaskLocation(columns, activeId);

  if (!activeLocation) {
    return null;
  }

  if (activeId === overId) {
    return {
      taskId: activeId,
      fromStatus: activeLocation.column.id,
      fromIndex: activeLocation.taskIndex,
      toStatus: activeLocation.column.id,
      toIndex: activeLocation.taskIndex,
    } satisfies TaskMoveIntent;
  }

  if (isTaskStatus(overId)) {
    const targetColumn = columns.find((column) => column.id === overId);

    return {
      taskId: activeId,
      fromStatus: activeLocation.column.id,
      fromIndex: activeLocation.taskIndex,
      toStatus: overId,
      toIndex: targetColumn?.tasks.length ?? 0,
    } satisfies TaskMoveIntent;
  }

  const overLocation = findTaskLocation(columns, overId);

  if (!overLocation) {
    return null;
  }

  return {
    taskId: activeId,
    fromStatus: activeLocation.column.id,
    fromIndex: activeLocation.taskIndex,
    toStatus: overLocation.column.id,
    toIndex: overLocation.taskIndex,
  } satisfies TaskMoveIntent;
}

export function applyTaskMove(columns: BoardColumn[], intent: TaskMoveIntent) {
  const nextColumns = cloneColumns(columns);
  const sourceColumn = nextColumns.find((column) => column.id === intent.fromStatus);
  const destinationColumn = nextColumns.find(
    (column) => column.id === intent.toStatus,
  );

  if (!sourceColumn || !destinationColumn) {
    return nextColumns;
  }

  const [task] = sourceColumn.tasks.splice(intent.fromIndex, 1);

  if (!task) {
    return nextColumns;
  }

  const nextTask = {
    ...task,
    status: intent.toStatus,
  };

  const insertionIndex = clampIndex(intent.toIndex, destinationColumn.tasks.length);
  destinationColumn.tasks.splice(insertionIndex, 0, nextTask);

  return nextColumns;
}

export function projectTaskMove(
  columns: BoardColumn[],
  activeId: string,
  overId: string,
) {
  const intent = resolveTaskMoveIntent(columns, activeId, overId);

  if (!intent) {
    return null;
  }

  return {
    intent,
    columns: applyTaskMove(columns, intent),
  };
}
