"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ActivityFeed } from "@/components/board/activity-feed";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { UserSwitcher } from "@/components/board/user-switcher";
import { ErrorState } from "@/components/common/error-state";
import { useColorMode } from "@/components/providers/app-providers";
import { useBoardRealtime } from "@/features/tasks/hooks/use-board-realtime";
import { useTaskActions } from "@/features/tasks/hooks/use-task-actions";
import { resolveTaskMoveIntent } from "@/features/tasks/lib/reorder";
import {
  BOARD_STATUS_ORDER,
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

function ThemeToggle() {
  const { mode, toggleMode } = useColorMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mode === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} mode`
          : "Toggle color mode"
      }
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      {!mounted ? (
        <span className="h-3.5 w-3.5 rounded-full border border-current opacity-70" />
      ) : isDark ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2.5v1.25M8 12.25v1.25M12.25 8h1.25M2.5 8h1.25M11.005 4.995l.884-.884M4.111 11.889l.884-.884M11.005 11.005l.884.884M4.111 4.111l.884.884M10.75 8A2.75 2.75 0 115.25 8a2.75 2.75 0 015.5 0z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M13 9.308A5.75 5.75 0 116.692 3 4.75 4.75 0 0013 9.308z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
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

  const { createTask, moveTask, reorderTask, updateTask } = useTaskActions();
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  useBoardRealtime();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );

  const activeTask = activeTaskId
    ? (findTaskLocation(columns, activeTaskId)?.task ?? null)
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

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    setActiveTaskId(null);

    if (!overId) {
      return;
    }

    const intent = resolveTaskMoveIntent(columns, activeId, overId);

    if (!intent) {
      return;
    }

    const unchanged =
      intent.fromStatus === intent.toStatus &&
      intent.fromIndex === intent.toIndex;

    if (unchanged) {
      return;
    }

    await runWithViewTransition(async () => {
      if (intent.fromStatus === intent.toStatus) {
        await reorderTask({
          taskId: intent.taskId,
          status: intent.toStatus,
          toIndex: intent.toIndex,
        });
        return;
      }

      await moveTask({
        taskId: intent.taskId,
        toStatus: intent.toStatus,
        toIndex: intent.toIndex,
      });
    });
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
    <div className="flex min-h-screen flex-col">
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={(args) => {
              const pointerCollisions = pointerWithin(args);
              if (pointerCollisions.length > 0) {
                return pointerCollisions;
              }

              return closestCorners(args);
            }}
            onDragStart={(event: DragStartEvent) => {
              setActiveTaskId(String(event.active.id));
            }}
            onDragCancel={() => setActiveTaskId(null)}
            onDragEnd={(event) => {
              void handleDragEnd(event).catch(() => undefined);
            }}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  onCreateTask={(status) =>
                    setDialogState({ mode: "create", status })
                  }
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
            "hidden overflow-hidden transition-[width,opacity] duration-300 ease-out xl:block",
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
