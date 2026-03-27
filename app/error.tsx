"use client";

import { ErrorState } from "@/components/common/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <ErrorState
          title="The board could not be loaded"
          message={error.message}
          actionLabel="Try again"
          onAction={reset}
        />
      </div>
    </main>
  );
}
