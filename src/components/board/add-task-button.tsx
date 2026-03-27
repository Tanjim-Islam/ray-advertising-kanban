import { cn } from "@/lib/utils/cn";

export function AddTaskButton({
  className,
  disabled = false,
  onClick,
  title,
}: {
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label="Add task"
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]",
        className,
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 3v10M3 8h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
