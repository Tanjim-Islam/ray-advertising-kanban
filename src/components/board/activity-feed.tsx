"use client";

import { formatDistanceToNow } from "date-fns";
import { useSyncExternalStore } from "react";

import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { UserSummary } from "@/features/tasks/types/user";

const ACTIVITY_ICONS: Record<string, string> = {
  TASK_CREATED: "●",
  TASK_UPDATED: "✎",
  TASK_MOVED: "→",
  TASK_REORDERED: "↕",
};

interface ActivityFeedProps {
  activities: ActivityRecord[];
  currentUser: UserSummary | null;
  onlineUserIds: string[];
  users: UserSummary[];
}

const subscribeToHydration = () => () => undefined;

function RelativeTimestamp({ value }: { value: string }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return (
    <time
      dateTime={value}
      className="mt-0.5 block text-[11px] text-[var(--text-tertiary)]"
      suppressHydrationWarning
    >
      {hydrated
        ? formatDistanceToNow(new Date(value), {
            addSuffix: true,
          })
        : ""}
    </time>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <aside className="flex h-full flex-col border-b border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Activity
        </h2>
      </div>

      <div className="min-h-0 flex-1 px-1 py-1">
        {activities.length > 0 ? (
          <div className="h-full overflow-y-auto rounded-b-xl">
            <div className="divide-y divide-[var(--border)]">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="animate-activity-enter flex gap-3 px-3 py-3"
                style={{
                  animationDelay: `${Math.min(index, 4) * 35}ms`,
                  viewTransitionName: `activity-${activity.id}`,
                }}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[10px] text-[var(--text-tertiary)]">
                  {ACTIVITY_ICONS[activity.type] ?? "·"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-[var(--text-primary)]">
                    <span className="font-medium">
                      {activity.actor?.name ?? "Someone"}
                    </span>{" "}
                    <span className="text-[var(--text-secondary)]">
                      {activity.message}
                    </span>
                  </p>
                  <RelativeTimestamp value={activity.createdAt} />
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="flex h-[180px] items-center justify-center px-4 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">No activity yet</p>
          </div>
        )}
      </div>
    </aside>
  );
}
