"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { AddTaskButton } from "@/components/board/add-task-button";
import { TaskCard } from "@/components/board/task-card";
import { EmptyState } from "@/components/common/empty-state";
import type { RoleAccess } from "@/features/tasks/lib/role-access";
import type { BoardColumn as BoardColumnType } from "@/features/tasks/types/board";
import { BOARD_STATUS_ORDER } from "@/features/tasks/lib/task-utils";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils/cn";

const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-amber-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
};

export function BoardColumn({
  column,
  deletingTaskIds,
  permissions,
  onCreateTask,
  onDeleteTask,
  onEditTask,
  onMoveTask,
}: {
  column: BoardColumnType;
  deletingTaskIds?: ReadonlySet<string>;
  permissions: RoleAccess;
  onCreateTask: (status: BoardColumnType["id"]) => void;
  onDeleteTask?: (task: TaskRecord) => void;
  onEditTask?: (task: TaskRecord) => void;
  onMoveTask: (
    task: TaskRecord,
    direction: "down" | "left" | "right" | "up",
  ) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });
  const columnIndex = BOARD_STATUS_ORDER.indexOf(column.id);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[240px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5 transition-[background-color,border-color,box-shadow] duration-200",
        isOver &&
          "border-[var(--accent-border)] bg-[var(--accent-subtle)] shadow-[var(--shadow-soft)]",
      )}
      data-testid={`board-column-${column.id}`}
    >
      <div className="flex items-center justify-between px-1.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[column.id])} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {column.title}
          </h2>
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
            {column.tasks.length}
          </span>
        </div>
        <AddTaskButton
          onClick={() => onCreateTask(column.id)}
          disabled={!permissions.createTask}
          title={
            permissions.createTask
              ? "Add task"
              : "This role cannot create tasks."
          }
        />
      </div>
      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          {column.tasks.length > 0 ? (
            column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                canDrag={permissions.moveTask || permissions.reorderTask}
                isDeleting={deletingTaskIds?.has(task.id)}
                onDelete={permissions.deleteTask ? onDeleteTask : undefined}
                onEdit={permissions.editTask ? onEditTask : undefined}
                moveControls={{
                  moveLeft:
                    permissions.moveTask && columnIndex > 0
                      ? () => onMoveTask(task, "left")
                      : undefined,
                  moveRight:
                    permissions.moveTask &&
                    columnIndex < BOARD_STATUS_ORDER.length - 1
                      ? () => onMoveTask(task, "right")
                      : undefined,
                  moveUp:
                    permissions.reorderTask && index > 0
                      ? () => onMoveTask(task, "up")
                      : undefined,
                  moveDown:
                    permissions.reorderTask &&
                    index < column.tasks.length - 1
                      ? () => onMoveTask(task, "down")
                      : undefined,
                }}
              />
            ))
          ) : (
            <EmptyState
              title="No tasks"
              body={
                permissions.createTask
                  ? "Drop a task here or create one"
                  : permissions.moveTask || permissions.reorderTask
                    ? "Drop a task here"
                    : "No tasks available for this role"
              }
            />
          )}
        </div>
      </SortableContext>
    </section>
  );
}
