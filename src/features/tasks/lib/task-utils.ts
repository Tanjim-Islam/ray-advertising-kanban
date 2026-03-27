import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { BoardColumn } from "@/features/tasks/types/board";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task";

export const BOARD_STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
];

export const ORDER_INCREMENT = 1_000;

export const COLUMN_META: Record<
  TaskStatus,
  Pick<BoardColumn, "title" | "description" | "accent">
> = {
  TODO: {
    title: "To Do",
    description: "Queued work waiting for a teammate to pick it up.",
    accent: "from-amber-500 via-orange-400 to-yellow-300",
  },
  IN_PROGRESS: {
    title: "In Progress",
    description: "Active work being shaped, reviewed, or delivered.",
    accent: "from-teal-500 via-emerald-400 to-lime-300",
  },
  DONE: {
    title: "Done",
    description: "Completed work with persisted history and activity.",
    accent: "from-sky-500 via-cyan-400 to-blue-300",
  },
};

export function sortTasks(tasks: TaskRecord[]) {
  return [...tasks].sort((left, right) => {
    if (left.order === right.order) {
      return left.createdAt.localeCompare(right.createdAt);
    }

    return left.order - right.order;
  });
}

export function createEmptyColumns(): BoardColumn[] {
  return BOARD_STATUS_ORDER.map((status) => ({
    id: status,
    ...COLUMN_META[status],
    tasks: [],
  }));
}

export function createBoardColumns(tasks: TaskRecord[]) {
  const columns = createEmptyColumns();

  for (const task of sortTasks(tasks)) {
    const column = columns.find((value) => value.id === task.status);

    if (!column) {
      continue;
    }

    column.tasks.push(task);
  }

  return columns;
}

export function cloneColumns(columns: BoardColumn[]) {
  return columns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }));
}

export function findTaskLocation(columns: BoardColumn[], taskId: string) {
  for (const [columnIndex, column] of columns.entries()) {
    const taskIndex = column.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex >= 0) {
      return {
        column,
        columnIndex,
        taskIndex,
        task: column.tasks[taskIndex],
      };
    }
  }

  return null;
}

export function upsertTask(columns: BoardColumn[], task: TaskRecord) {
  const nextColumns = cloneColumns(columns);

  for (const column of nextColumns) {
    column.tasks = column.tasks.filter((value) => value.id !== task.id);
  }

  const targetColumn = nextColumns.find((column) => column.id === task.status);

  if (!targetColumn) {
    return nextColumns;
  }

  targetColumn.tasks = sortTasks([...targetColumn.tasks, task]);

  return nextColumns;
}

export function removeTask(columns: BoardColumn[], taskId: string) {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => task.id !== taskId),
  }));
}

export function applyTaskCollection(columns: BoardColumn[], tasks: TaskRecord[]) {
  return tasks.reduce((currentColumns, task) => upsertTask(currentColumns, task), columns);
}

export function replaceOptimisticTask(
  columns: BoardColumn[],
  clientRequestId: string,
  task: TaskRecord,
) {
  const nextColumns = cloneColumns(columns);

  for (const column of nextColumns) {
    column.tasks = column.tasks.filter(
      (value) => value.clientRequestId !== clientRequestId,
    );
  }

  return upsertTask(nextColumns, task);
}

export function prependActivity(
  activities: ActivityRecord[],
  activity: ActivityRecord,
  limit = 12,
) {
  return [activity, ...activities.filter((entry) => entry.id !== activity.id)].slice(
    0,
    limit,
  );
}
