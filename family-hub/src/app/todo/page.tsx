import { TodoScreen } from "@/components/todo/TodoScreen";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const hallway = await loadHallway(searchParams);
  return <TodoScreen {...hallway} />;
}
