import { Board } from "@/components/board/board";
import { getBoardSnapshot } from "@/lib/db/queries/board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getBoardSnapshot();

  return (
    <main className="flex min-h-screen flex-col">
      <Board initialSnapshot={snapshot} />
    </main>
  );
}
