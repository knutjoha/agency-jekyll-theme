import { TodoScreen } from "@/components/todo/TodoScreen";
import { loadTodos } from "@/lib/household/store";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const [hallway, todos] = await Promise.all([loadHallway(Promise.resolve(params)), loadTodos({ snapshot })]);
  return <TodoScreen {...hallway} lanes={todos.lanes} persisted={todos.persisted} />;
}
