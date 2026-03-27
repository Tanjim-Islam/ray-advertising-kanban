import { formatDistanceToNow } from "date-fns";

import type { ActivityRecord } from "@/features/tasks/types/activity";
import type { UserSummary } from "@/features/tasks/types/user";
import { cn } from "@/lib/utils/cn";

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

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <aside className="flex h-full flex-col border-b border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Activity
        </h2>
      </div>

      <div className="flex-1 px-1 py-1">
        {activities.length > 0 ? (
          <div
            className={cn(
              "divide-y divide-[var(--border)] overflow-y-auto rounded-b-xl",
              activities.length > 5 && "max-h-[372px]",
            )}
          >
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
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
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
