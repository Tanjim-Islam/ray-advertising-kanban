"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { ActivityFeed } from "@/components/board/activity-feed";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { UserSwitcher } from "@/components/board/user-switcher";
import { ErrorState } from "@/components/common/error-state";
import { useColorMode } from "@/components/providers/app-providers";
import { useBoardRealtime } from "@/features/tasks/hooks/use-board-realtime";
import { useTaskActions } from "@/features/tasks/hooks/use-task-actions";
import { applyTaskMove } from "@/features/tasks/lib/reorder";
import {
  BOARD_STATUS_ORDER,
  cloneColumns,
  findTaskLocation,
} from "@/features/tasks/lib/task-utils";
import {
  BoardStoreProvider,
  useBoardStore,
} from "@/features/tasks/store/board-store";
import {
  UserStoreProvider,
  useCurrentUser,
  useUserStore,
} from "@/features/tasks/store/user-store";
import type { BoardSnapshot } from "@/features/tasks/types/board";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils/cn";

const TaskFormDialog = dynamic(
  () =>
    import("@/components/board/task-form-dialog").then(
      (module) => module.TaskFormDialog,
    ),
  {
    ssr: false,
  },
);

type DialogState =
  | { mode: "create"; status: TaskStatus }
  | { mode: "edit"; task: TaskRecord }
  | null;

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    update: () => Promise<void> | void,
  ) => {
    finished: Promise<void>;
  };
};

async function runWithViewTransition(action: () => Promise<void>) {
  if (
    typeof document === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    await action();
    return;
  }

  const transitionDocument = document as ViewTransitionDocument;

  if (!transitionDocument.startViewTransition) {
    await action();
    return;
  }

  const transition = transitionDocument.startViewTransition(async () => {
    await action();
  });

  await transition.finished.catch(() => undefined);
}

function getDragPosition(
  columns: BoardSnapshot["columns"],
  taskId: string,
) {
  const location = findTaskLocation(columns, taskId);

  return location
    ? `${location.column.id}:${location.taskIndex}`
    : null;
}

function isTaskStatus(value: string): value is TaskStatus {
  return BOARD_STATUS_ORDER.includes(value as TaskStatus);
}

function findContainerId(columns: BoardSnapshot["columns"], id: string) {
  if (isTaskStatus(id)) {
    return id;
  }

  return findTaskLocation(columns, id)?.column.id ?? null;
}

function projectDragColumns(params: {
  activeId: string;
  activeRectTop: number | undefined;
  columns: BoardSnapshot["columns"];
  overId: string;
  overRectHeight: number;
  overRectTop: number;
}) {
  if (params.activeId === params.overId) {
    return params.columns;
  }

  const activeLocation = findTaskLocation(params.columns, params.activeId);
  const overContainerId = findContainerId(params.columns, params.overId);

  if (!activeLocation || !overContainerId) {
    return params.columns;
  }

  const targetColumn = params.columns.find(
    (column) => column.id === overContainerId,
  );

  if (!targetColumn) {
    return params.columns;
  }

  const overLocation = isTaskStatus(params.overId)
    ? null
    : findTaskLocation(params.columns, params.overId);

  let toIndex = targetColumn.tasks.length;

  if (overLocation) {
    const isBelowOverItem =
      params.activeRectTop !== undefined &&
      params.activeRectTop > params.overRectTop + params.overRectHeight / 2;

    toIndex = overLocation.taskIndex + (isBelowOverItem ? 1 : 0);
  }

  if (
    activeLocation.column.id === overContainerId &&
    activeLocation.taskIndex === toIndex
  ) {
    return params.columns;
  }

  return applyTaskMove(params.columns, {
    taskId: params.activeId,
    fromStatus: activeLocation.column.id,
    fromIndex: activeLocation.taskIndex,
    toStatus: overContainerId,
    toIndex,
  });
}

function ThemeToggle() {
  const { toggleMode } = useColorMode();

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle color mode"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      <span className="theme-icon theme-icon-dark" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2.5v1.25M8 12.25v1.25M12.25 8h1.25M2.5 8h1.25M11.005 4.995l.884-.884M4.111 11.889l.884-.884M11.005 11.005l.884.884M4.111 4.111l.884.884M10.75 8A2.75 2.75 0 115.25 8a2.75 2.75 0 015.5 0z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="theme-icon theme-icon-light" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M13 9.308A5.75 5.75 0 116.692 3 4.75 4.75 0 0013 9.308z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

function BoardSurface() {
  const columns = useBoardStore((state) => state.columns);
  const activities = useBoardStore((state) => state.activities);
  const connectionStatus = useBoardStore((state) => state.connectionStatus);
  const isMutating = useBoardStore((state) => state.isMutating);
  const lastError = useBoardStore((state) => state.lastError);
  const clearError = useBoardStore((state) => state.setLastError);

  const users = useUserStore((state) => state.users);
  const currentUserId = useUserStore((state) => state.currentUserId);
  const setCurrentUserId = useUserStore((state) => state.setCurrentUserId);
  const onlineUserIds = useUserStore((state) => state.onlineUserIds);
  const currentUser = useCurrentUser();

  const { createTask, deleteTask, moveTask, reorderTask, updateTask } =
    useTaskActions();
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [dragColumns, setDragColumns] = useState<BoardSnapshot["columns"] | null>(
    null,
  );
  const [deletingTaskIds, setDeletingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showActivity, setShowActivity] = useState(false);
  const dragSnapshotRef = useRef<BoardSnapshot["columns"] | null>(null);
  const lastOverIdRef = useRef<string | null>(null);
  const recentlyMovedToNewColumnRef = useRef(false);

  useBoardRealtime();

  useEffect(() => {
    if (!activeTaskId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      recentlyMovedToNewColumnRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeTaskId, dragColumns]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );

  const renderedColumns = dragColumns ?? columns;
  const activeTask = activeTaskId
    ? (findTaskLocation(dragSnapshotRef.current ?? columns, activeTaskId)?.task ??
      findTaskLocation(columns, activeTaskId)?.task ??
      null)
    : null;

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const isConnected = connectionStatus === "connected";
  const renderActivityPanel = () => (
    <ActivityFeed
      activities={activities}
      users={users}
      currentUser={currentUser}
      onlineUserIds={onlineUserIds}
    />
  );

  function clearDeleteState(taskId: string) {
    setDeletingTaskIds((current) => {
      const next = new Set(current);
      next.delete(taskId);
      return next;
    });
  }

  const collisionDetectionStrategy = useCallback(
    (
      args: Parameters<
        NonNullable<ComponentProps<typeof DndContext>["collisionDetection"]>
      >[0],
    ) => {
      const pointerCollisions = pointerWithin(args);
      const collisions =
        pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
      let overId = getFirstCollision(collisions, "id");

      if (overId) {
        const previewColumns = dragColumns ?? dragSnapshotRef.current ?? columns;
        const overContainerId = findContainerId(previewColumns, String(overId));
        const overColumn = overContainerId
          ? previewColumns.find((column) => column.id === overContainerId)
          : null;

        if (
          overColumn &&
          String(overId) === overColumn.id &&
          overColumn.tasks.length > 0
        ) {
          const itemCollision = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter((container) =>
              container.id !== activeTaskId &&
              overColumn.tasks.some((task) => task.id === container.id),
            ),
          })[0]?.id;

          if (itemCollision) {
            overId = itemCollision;
          }
        }

        lastOverIdRef.current = String(overId);
        return [{ id: overId }];
      }

      if (recentlyMovedToNewColumnRef.current && activeTaskId) {
        lastOverIdRef.current = activeTaskId;
      }

      return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
    },
    [activeTaskId, columns, dragColumns],
  );

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!activeTaskId || !overId) {
      return;
    }

    setDragColumns((current) => {
      const previewColumns = current ?? cloneColumns(columns);
      const previousLocation = findTaskLocation(previewColumns, activeTaskId);
      const nextColumns = projectDragColumns({
        activeId: activeTaskId,
        activeRectTop: event.active.rect.current.translated?.top,
        columns: previewColumns,
        overId,
        overRectHeight: event.over?.rect.height ?? 0,
        overRectTop: event.over?.rect.top ?? 0,
      });

      if (
        getDragPosition(previewColumns, activeTaskId) ===
        getDragPosition(nextColumns, activeTaskId)
      ) {
        return current;
      }

      const nextLocation = findTaskLocation(nextColumns, activeTaskId);
      recentlyMovedToNewColumnRef.current =
        previousLocation?.column.id !== nextLocation?.column.id;

      return nextColumns;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const finalColumns = dragColumns ?? columns;
    const sourceColumns = dragSnapshotRef.current ?? columns;
    const lastOverId = lastOverIdRef.current;
    const previewChanged =
      getDragPosition(sourceColumns, activeId) !==
      getDragPosition(finalColumns, activeId);

    const resetDragState = () => {
      setActiveTaskId(null);
      setDragColumns(null);
      dragSnapshotRef.current = null;
      lastOverIdRef.current = null;
      recentlyMovedToNewColumnRef.current = false;
    };

    if (!event.over && (!previewChanged || lastOverId === activeId)) {
      resetDragState();
      return;
    }

    const sourceLocation = findTaskLocation(sourceColumns, activeId);
    const destinationLocation = findTaskLocation(finalColumns, activeId);

    if (!sourceLocation || !destinationLocation) {
      resetDragState();
      return;
    }

    const unchanged =
      sourceLocation.column.id === destinationLocation.column.id &&
      sourceLocation.taskIndex === destinationLocation.taskIndex;

    if (unchanged) {
      resetDragState();
      return;
    }

    setActiveTaskId(null);

    try {
      await runWithViewTransition(async () => {
        if (sourceLocation.column.id === destinationLocation.column.id) {
          await reorderTask({
            taskId: activeId,
            status: destinationLocation.column.id,
            toIndex: destinationLocation.taskIndex,
          });
          return;
        }

        await moveTask({
          taskId: activeId,
          toStatus: destinationLocation.column.id,
          toIndex: destinationLocation.taskIndex,
        });
      });
    } finally {
      resetDragState();
    }
  }

  async function handleDeleteTask(task: TaskRecord) {
    if (deletingTaskIds.has(task.id)) {
      return;
    }

    setDeletingTaskIds((current) => {
      const next = new Set(current);
      next.add(task.id);
      return next;
    });

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 180);
      });

      await runWithViewTransition(async () => {
        await deleteTask({
          taskId: task.id,
        });
      });
    } finally {
      clearDeleteState(task.id);
    }
  }

  async function handleTaskMovement(
    task: TaskRecord,
    direction: "down" | "left" | "right" | "up",
  ) {
    const location = findTaskLocation(columns, task.id);

    if (!location) {
      return;
    }

    await runWithViewTransition(async () => {
      if (direction === "up" && location.taskIndex > 0) {
        await reorderTask({
          taskId: task.id,
          status: location.column.id,
          toIndex: location.taskIndex - 1,
        });
        return;
      }

      if (
        direction === "down" &&
        location.taskIndex < location.column.tasks.length - 1
      ) {
        await reorderTask({
          taskId: task.id,
          status: location.column.id,
          toIndex: location.taskIndex + 1,
        });
        return;
      }

      const statusIndex = BOARD_STATUS_ORDER.indexOf(location.column.id);
      const targetStatus =
        direction === "left"
          ? BOARD_STATUS_ORDER[statusIndex - 1]
          : direction === "right"
            ? BOARD_STATUS_ORDER[statusIndex + 1]
            : undefined;

      if (!targetStatus) {
        return;
      }

      const targetColumn = columns.find((column) => column.id === targetStatus);

      await moveTask({
        taskId: task.id,
        toStatus: targetStatus,
        toIndex: targetColumn?.tasks.length ?? 0,
      });
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-raised)]">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] shadow-sm">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                <rect
                  x="9"
                  y="1"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  opacity="0.6"
                />
                <rect
                  x="1"
                  y="9"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  opacity="0.6"
                />
                <rect
                  x="9"
                  y="9"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="white"
                  opacity="0.3"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Ray
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserSwitcher
              users={users}
              currentUserId={currentUserId}
              onlineUserIds={onlineUserIds}
              onSelect={setCurrentUserId}
            />
            <div className="hidden items-center gap-1.5 sm:flex">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition",
                  isConnected
                    ? "bg-emerald-500"
                    : connectionStatus === "connecting"
                      ? "animate-pulse bg-amber-400"
                      : "bg-red-400",
                )}
              />
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {isConnected
                  ? "Live"
                  : connectionStatus === "connecting"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-raised)]">
        <div className="flex h-11 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              Board
            </h1>
            {totalTasks > 0 ? (
              <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
                {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDialogState({ mode: "create", status: "TODO" })}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              New task
            </button>
            <button
              type="button"
              onClick={() => setShowActivity((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition",
                showActivity
                  ? "border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
              )}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 8H6M14 4H2M14 12H2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Activity
              {activities.length > 0 ? (
                <span className="ml-0.5 tabular-nums">{activities.length}</span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {lastError ? (
        <div className="shrink-0 px-4 pt-3 sm:px-6">
          <ErrorState
            title="Action failed"
            message={lastError}
            actionLabel="Dismiss"
            onAction={() => clearError(null)}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
            onDragStart={(event: DragStartEvent) => {
              const activeId = String(event.active.id);
              const snapshot = cloneColumns(columns);

              setActiveTaskId(activeId);
              setDragColumns(snapshot);
              dragSnapshotRef.current = snapshot;
              lastOverIdRef.current = activeId;
              recentlyMovedToNewColumnRef.current = false;
            }}
            onDragOver={handleDragOver}
            onDragCancel={() => {
              setActiveTaskId(null);
              setDragColumns(null);
              dragSnapshotRef.current = null;
              lastOverIdRef.current = null;
              recentlyMovedToNewColumnRef.current = false;
            }}
            onDragEnd={(event) => {
              void handleDragEnd(event).catch(() => undefined);
            }}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {renderedColumns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  deletingTaskIds={deletingTaskIds}
                  onCreateTask={(status) =>
                    setDialogState({ mode: "create", status })
                  }
                  onDeleteTask={(task) => {
                    void handleDeleteTask(task).catch(() => undefined);
                  }}
                  onEditTask={(task) => setDialogState({ mode: "edit", task })}
                  onMoveTask={(task, direction) => {
                    void handleTaskMovement(task, direction).catch(
                      () => undefined,
                    );
                  }}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="w-[300px]">
                  <TaskCard task={activeTask} onEdit={() => undefined} overlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div
          className={cn(
            "hidden h-full overflow-hidden transition-[width,opacity] duration-300 ease-out xl:block",
            showActivity ? "w-80 opacity-100" : "w-0 opacity-0",
          )}
        >
          <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface-raised)]">
            {renderActivityPanel()}
          </aside>
        </div>

        <div
          className={cn(
            "xl:hidden",
            showActivity ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div
            className={cn(
              "fixed inset-0 z-30 bg-[var(--scrim)] transition-opacity duration-300",
              showActivity ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setShowActivity(false)}
          />
          <aside
            className={cn(
              "fixed right-0 top-0 z-40 flex h-full w-80 max-w-[88vw] flex-col border-l border-[var(--border)] bg-[var(--surface-raised)] shadow-xl transition-transform duration-300 ease-out",
              showActivity ? "translate-x-0" : "translate-x-full",
            )}
          >
            {renderActivityPanel()}
          </aside>
        </div>
      </div>

      <TaskFormDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        statusLabel={
          dialogState?.mode === "create"
            ? columns.find((column) => column.id === dialogState.status)?.title
            : undefined
        }
        initialValues={
          dialogState?.mode === "edit"
            ? {
                title: dialogState.task.title,
                description: dialogState.task.description,
              }
            : undefined
        }
        submitting={isMutating}
        onClose={() => {
          if (!isMutating) {
            setDialogState(null);
          }
        }}
        onSubmit={async (values) => {
          if (dialogState?.mode === "create") {
            await runWithViewTransition(async () => {
              await createTask({
                title: values.title,
                description: values.description,
                status: dialogState.status,
              });
            });
            setDialogState(null);
            return;
          }

          if (dialogState?.mode === "edit") {
            await runWithViewTransition(async () => {
              await updateTask({
                taskId: dialogState.task.id,
                title: values.title,
                description: values.description,
              });
            });
            setDialogState(null);
          }
        }}
      />
    </div>
  );
}

export function Board({ initialSnapshot }: { initialSnapshot: BoardSnapshot }) {
  return (
    <BoardStoreProvider snapshot={initialSnapshot}>
      <UserStoreProvider users={initialSnapshot.users}>
        <BoardSurface />
      </UserStoreProvider>
    </BoardStoreProvider>
  );
}
