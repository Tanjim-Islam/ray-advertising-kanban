"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { useSyncExternalStore, type SyntheticEvent } from "react";

import type { TaskRecord } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils/cn";

interface TaskCardBodyProps {
  canDrag?: boolean;
  isDeleting?: boolean;
  isDragging?: boolean;
  moveControls?: {
    moveDown?: () => void;
    moveLeft?: () => void;
    moveRight?: () => void;
    moveUp?: () => void;
  };
  onDelete?: (task: TaskRecord) => void;
  onEdit?: (task: TaskRecord) => void;
  task: TaskRecord;
}

const moveButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]";
const deleteButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-md border border-[var(--danger-border)] bg-[var(--danger-subtle)] text-[var(--danger-text)] transition-colors hover:bg-[var(--danger-border)] hover:text-[var(--danger-text-strong)]";

const nonDragRegionProps = {
  onMouseDownCapture: stopDragPropagation,
  onPointerDownCapture: stopDragPropagation,
  onTouchStartCapture: stopDragPropagation,
};

function stopDragPropagation(event: SyntheticEvent) {
  event.stopPropagation();
}

const subscribeToHydration = () => () => undefined;

function RelativeTimestamp({ value }: { value: string }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return (
    <span className="truncate text-[11px] text-[var(--text-tertiary)]">
      {hydrated
        ? formatDistanceToNow(new Date(value), {
            addSuffix: true,
          })
        : ""}
    </span>
  );
}

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
  canDrag,
  isDeleting,
  isDragging,
  moveControls,
  onDelete,
  onEdit,
  task,
}: TaskCardBodyProps) {
  const actor = task.updatedBy ?? task.createdBy;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-soft)] transition-[background-color,border-color,box-shadow,opacity,transform] duration-200",
        isDragging && "shadow-lg ring-2 ring-[var(--accent-border)]",
        isDeleting && "pointer-events-none scale-[0.96] opacity-0",
        task.optimistic && "border-dashed border-[var(--accent-border)] bg-[var(--accent-subtle)]/60",
        canDrag && "cursor-grab active:cursor-grabbing",
      )}
      data-testid={`task-card-${task.id}`}
    >
      <div className="relative z-10 space-y-3">
        <div className="max-w-[calc(100%-2.5rem)]">
          <h3
            className="cursor-default text-[13px] font-medium leading-snug text-[var(--text-primary)]"
            {...nonDragRegionProps}
          >
            {task.title}
          </h3>
          {task.description ? (
            <p
              className="mt-1.5 line-clamp-3 cursor-default text-xs leading-relaxed text-[var(--text-secondary)]"
              {...nonDragRegionProps}
            >
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {actor ? (
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                style={{ backgroundColor: actor.color }}
                title={actor.name}
                {...nonDragRegionProps}
              >
                {actor.initials}
              </div>
            ) : null}
            <span {...nonDragRegionProps}>
              {task.optimistic ? (
                <span className="truncate text-[11px] text-[var(--text-tertiary)]">
                  Saving…
                </span>
              ) : (
                <RelativeTimestamp value={task.updatedAt} />
              )}
            </span>
          </div>

          <div className="relative z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            {moveControls?.moveLeft ? (
              <button
                type="button"
                onClick={moveControls.moveLeft}
                aria-label="Move task left"
                className={moveButtonClass}
                {...nonDragRegionProps}
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
                {...nonDragRegionProps}
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
                {...nonDragRegionProps}
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
                {...nonDragRegionProps}
              >
                <MoveIcon d="M6 4l4 4-4 4" />
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="ml-0.5 flex h-6 items-center rounded-md px-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                {...nonDragRegionProps}
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label="Delete task"
                className={deleteButtonClass}
                {...nonDragRegionProps}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 4.5h9M6.5 2.75h3M5.5 6.25v5.5M8 6.25v5.5M10.5 6.25v5.5M4.5 4.5l.4 7.2A1.5 1.5 0 006.397 13h3.206a1.5 1.5 0 001.497-1.3l.4-7.2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function TaskCard({
  canDrag = true,
  isDeleting = false,
  moveControls,
  onDelete,
  onEdit,
  overlay = false,
  task,
}: {
  canDrag?: boolean;
  isDeleting?: boolean;
  moveControls?: TaskCardBodyProps["moveControls"];
  onDelete?: (task: TaskRecord) => void;
  onEdit?: (task: TaskRecord) => void;
  overlay?: boolean;
  task: TaskRecord;
}) {
  if (overlay) {
    return <TaskCardBody task={task} onEdit={onEdit} isDragging canDrag={canDrag} />;
  }

  return (
    <SortableTaskCard
      canDrag={canDrag}
      task={task}
      onEdit={onEdit}
      onDelete={onDelete}
      moveControls={moveControls}
      isDeleting={isDeleting}
    />
  );
}

function SortableTaskCard({
  canDrag,
  isDeleting,
  moveControls,
  onDelete,
  onEdit,
  task,
}: {
  canDrag?: boolean;
  isDeleting?: boolean;
  moveControls?: TaskCardBodyProps["moveControls"];
  onDelete?: (task: TaskRecord) => void;
  onEdit?: (task: TaskRecord) => void;
  task: TaskRecord;
}) {
  const { isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
      disabled: !canDrag || isDeleting,
    });

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? listeners : undefined)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        viewTransitionName: isDragging ? "none" : `task-${task.id}`,
      }}
      className={cn(
        "will-change-transform",
        canDrag && !isDeleting && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <TaskCardBody
        canDrag={canDrag}
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        moveControls={moveControls}
        isDeleting={isDeleting}
        isDragging={isDragging}
      />
    </div>
  );
}
