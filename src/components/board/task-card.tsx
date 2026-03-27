"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";

import type { TaskRecord } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils/cn";

interface TaskCardBodyProps {
  dragSurfaceProps?: Record<string, unknown>;
  isDragging?: boolean;
  moveControls?: {
    moveDown?: () => void;
    moveLeft?: () => void;
    moveRight?: () => void;
    moveUp?: () => void;
  };
  onEdit: (task: TaskRecord) => void;
  task: TaskRecord;
}

const moveButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]";

function MoveIcon({ d }: { d: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TaskCardBody({
  dragSurfaceProps,
  isDragging,
  moveControls,
  onEdit,
  task,
}: TaskCardBodyProps) {
  const actor = task.updatedBy ?? task.createdBy;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-soft)] transition-[background-color,border-color,box-shadow,opacity] duration-200",
        isDragging && "shadow-lg ring-2 ring-[var(--accent-border)]",
        task.optimistic && "border-dashed border-[var(--accent-border)] bg-[var(--accent-subtle)]/60",
      )}
      data-testid={`task-card-${task.id}`}
    >
      {dragSurfaceProps ? (
        <>
          <div
            aria-label="Drag task"
            className="absolute inset-x-0 top-0 h-3 cursor-grab rounded-t-xl active:cursor-grabbing"
            {...dragSurfaceProps}
          />
          <div
            aria-label="Drag task"
            className="absolute inset-y-0 left-0 w-3 cursor-grab rounded-l-xl active:cursor-grabbing"
            {...dragSurfaceProps}
          />
          <div
            aria-label="Drag task"
            data-testid={`task-card-drag-surface-${task.id}`}
            className="absolute inset-y-0 right-0 w-8 cursor-grab rounded-r-xl active:cursor-grabbing"
            {...dragSurfaceProps}
          />
        </>
      ) : null}

      <div className="pointer-events-none relative z-10 space-y-3">
        <div className="pointer-events-auto max-w-[calc(100%-2.5rem)]">
          <h3 className="text-[13px] font-medium leading-snug text-[var(--text-primary)]">
            {task.title}
          </h3>
          {task.description ? (
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="pointer-events-auto flex min-w-0 items-center gap-2">
            {actor ? (
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                style={{ backgroundColor: actor.color }}
                title={actor.name}
              >
                {actor.initials}
              </div>
            ) : null}
            <span className="truncate text-[11px] text-[var(--text-tertiary)]">
              {task.optimistic
                ? "Saving…"
                : formatDistanceToNow(new Date(task.updatedAt), {
                    addSuffix: true,
                  })}
            </span>
          </div>

          <div className="pointer-events-auto relative z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            {moveControls?.moveLeft ? (
              <button
                type="button"
                onClick={moveControls.moveLeft}
                aria-label="Move task left"
                className={moveButtonClass}
              >
                <MoveIcon d="M10 4L6 8l4 4" />
              </button>
            ) : null}
            {moveControls?.moveUp ? (
              <button
                type="button"
                onClick={moveControls.moveUp}
                aria-label="Move task up"
                className={moveButtonClass}
              >
                <MoveIcon d="M4 10l4-4 4 4" />
              </button>
            ) : null}
            {moveControls?.moveDown ? (
              <button
                type="button"
                onClick={moveControls.moveDown}
                aria-label="Move task down"
                className={moveButtonClass}
              >
                <MoveIcon d="M4 6l4 4 4-4" />
              </button>
            ) : null}
            {moveControls?.moveRight ? (
              <button
                type="button"
                onClick={moveControls.moveRight}
                aria-label="Move task right"
                className={moveButtonClass}
              >
                <MoveIcon d="M6 4l4 4-4 4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="ml-0.5 flex h-6 items-center rounded-md px-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TaskCard({
  moveControls,
  onEdit,
  overlay = false,
  task,
}: {
  moveControls?: TaskCardBodyProps["moveControls"];
  onEdit: (task: TaskRecord) => void;
  overlay?: boolean;
  task: TaskRecord;
}) {
  if (overlay) {
    return <TaskCardBody task={task} onEdit={onEdit} isDragging />;
  }

  return (
    <SortableTaskCard task={task} onEdit={onEdit} moveControls={moveControls} />
  );
}

function SortableTaskCard({
  moveControls,
  onEdit,
  task,
}: {
  moveControls?: TaskCardBodyProps["moveControls"];
  onEdit: (task: TaskRecord) => void;
  task: TaskRecord;
}) {
  const { isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        viewTransitionName: isDragging ? "none" : `task-${task.id}`,
      }}
      className={cn("will-change-transform", isDragging && "opacity-50")}
    >
      <TaskCardBody
        task={task}
        onEdit={onEdit}
        moveControls={moveControls}
        isDragging={isDragging}
        dragSurfaceProps={{
          ...listeners,
        }}
      />
    </div>
  );
}
