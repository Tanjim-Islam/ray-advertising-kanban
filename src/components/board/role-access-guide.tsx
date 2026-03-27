"use client";

import {
  getAllowedTaskPermissions,
  getRoleAccess,
  ROLE_ACCESS_ORDER,
  TASK_PERMISSION_LABELS,
  TASK_PERMISSION_ORDER,
} from "@/features/tasks/lib/role-access";
import type { UserSummary } from "@/features/tasks/types/user";
import { cn } from "@/lib/utils/cn";

export function RoleAccessGuide({
  currentUser,
}: {
  currentUser: UserSummary | null;
}) {
  const activeRole = currentUser?.role ?? null;
  const activePermissions = getAllowedTaskPermissions(activeRole);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Role Access
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {currentUser ? currentUser.name : "No teammate selected"}
            </span>
            {activeRole ? (
              <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                {activeRole}
              </span>
            ) : null}
          </div>
        </div>

        {activePermissions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activePermissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--accent)]"
              >
                {TASK_PERMISSION_LABELS[permission]}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {ROLE_ACCESS_ORDER.map((role) => {
          const permissions = getRoleAccess(role);
          const isActive = role === activeRole;
          const allowedPermissions = TASK_PERMISSION_ORDER.filter(
            (permission) => permissions[permission],
          );
          const blockedPermissions = TASK_PERMISSION_ORDER.filter(
            (permission) => !permissions[permission],
          );

          return (
            <article
              key={role}
              className={cn(
                "rounded-lg border bg-[var(--surface-raised)] p-3 transition-[border-color,background-color]",
                isActive
                  ? "border-[var(--accent-border)] bg-[var(--accent-subtle)]/60"
                  : "border-[var(--border)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  {role}
                </h3>
                {isActive ? (
                  <span
                    className="inline-flex aspect-square h-5 min-h-5 w-5 min-w-5 items-center justify-center self-start rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                    title="Current role"
                    aria-label="Current role"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6.5 10.5L4 8l1.1-1.1 1.4 1.4 4.4-4.4L12 5l-5.5 5.5z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Allowed
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {allowedPermissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--accent)]"
                      >
                        {TASK_PERMISSION_LABELS[permission]}
                      </span>
                    ))}
                  </div>
                </div>

                {blockedPermissions.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Restricted
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {blockedPermissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-medium text-[var(--text-tertiary)]"
                        >
                          {TASK_PERMISSION_LABELS[permission]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
