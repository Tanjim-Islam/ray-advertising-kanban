import { Board } from "@/components/board/board";
import { getBoardSnapshot } from "@/lib/db/queries/board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getBoardSnapshot();

  return (
    <main className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
      <Board initialSnapshot={snapshot} />
    </main>
  );
}
