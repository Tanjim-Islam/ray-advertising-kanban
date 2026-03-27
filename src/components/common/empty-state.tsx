export function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-10 text-center">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          {title}
        </p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{body}</p>
      </div>
    </div>
  );
}
