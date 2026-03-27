export function ErrorState({
  actionLabel,
  message,
  onAction,
  title,
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-subtle)] px-4 py-3">
      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--danger)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--danger-text-strong)]">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-[var(--danger-text)]">{message}</p>
      </div>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-[var(--danger-text)] transition hover:bg-[var(--danger-border)]/40"
        >
          {actionLabel ?? "Retry"}
        </button>
      ) : null}
    </div>
  );
}
