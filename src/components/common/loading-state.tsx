import { cn } from "@/lib/utils/cn";

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-soft)]" />
      </div>
      <div className="flex-1 p-6">
        <div className="grid h-full gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-muted)]" />
                <div className="h-3 w-4 animate-pulse rounded bg-[var(--surface-muted)]" />
              </div>
              {[0, 1, 2].map((cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3"
                >
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-[var(--surface-soft)]" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--surface-soft)]" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
