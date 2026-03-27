"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { AddTaskButton } from "@/components/board/add-task-button";
import { TaskCard } from "@/components/board/task-card";
import { EmptyState } from "@/components/common/empty-state";
import type { BoardColumn as BoardColumnType } from "@/features/tasks/types/board";
import type { TaskRecord } from "@/features/tasks/types/task";
import { BOARD_STATUS_ORDER } from "@/features/tasks/lib/task-utils";
import type { TaskStatus } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils/cn";

const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-amber-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
};

export function BoardColumn({
  column,
  onCreateTask,
  onEditTask,
  onMoveTask,
}: {
  column: BoardColumnType;
  onCreateTask: (status: BoardColumnType["id"]) => void;
  onEditTask: (task: TaskRecord) => void;
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
        <AddTaskButton onClick={() => onCreateTask(column.id)} />
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
                onEdit={onEditTask}
                moveControls={{
                  moveLeft:
                    columnIndex > 0
                      ? () => onMoveTask(task, "left")
                      : undefined,
                  moveRight:
                    columnIndex < BOARD_STATUS_ORDER.length - 1
                      ? () => onMoveTask(task, "right")
                      : undefined,
                  moveUp: index > 0 ? () => onMoveTask(task, "up") : undefined,
                  moveDown:
                    index < column.tasks.length - 1
                      ? () => onMoveTask(task, "down")
                      : undefined,
                }}
              />
            ))
          ) : (
            <EmptyState
              title="No tasks"
              body="Drop a task here or create one"
            />
          )}
        </div>
      </SortableContext>
    </section>
  );
}
