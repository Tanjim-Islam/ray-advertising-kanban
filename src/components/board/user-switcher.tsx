import type { UserSummary } from "@/features/tasks/types/user";
import { cn } from "@/lib/utils/cn";

export function UserSwitcher({
  currentUserId,
  onlineUserIds,
  onSelect,
  users,
}: {
  currentUserId: string | null;
  onlineUserIds: string[];
  onSelect: (userId: string) => void;
  users: UserSummary[];
}) {
  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="flex items-center gap-3" data-testid="user-switcher">
      <div className="flex items-center -space-x-1">
        {users.map((user) => {
          const isActive = user.id === currentUserId;
          const isOnline = onlineUserIds.includes(user.id);

          return (
            <button
              key={user.id}
              type="button"
              data-testid={`user-option-${user.id}`}
              onClick={() => onSelect(user.id)}
              title={`${user.name}${user.role ? ` · ${user.role}` : ""}${isActive ? " (you)" : ""}`}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 transition",
                isActive
                  ? "z-10 ring-[var(--accent)]"
                  : "ring-[var(--surface-raised)] opacity-80 hover:z-10 hover:opacity-100",
              )}
              style={{ backgroundColor: user.color }}
            >
              {user.initials}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-raised)] bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
      {currentUser && (
        <div className="hidden sm:block">
          <p className="text-xs text-[var(--text-secondary)]">{currentUser.name}</p>
          {currentUser.role ? (
            <p className="text-[11px] text-[var(--text-tertiary)]">{currentUser.role}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
