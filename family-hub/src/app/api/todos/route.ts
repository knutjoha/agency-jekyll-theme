import { NextResponse } from "next/server";
import { createTodo, loadTodos, updateTodo } from "@/lib/household/store";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  return NextResponse.json(await loadTodos(), { headers });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return NextResponse.json({ persisted: false }, { status: 400, headers });
  const result = await createTodo(body);
  return NextResponse.json(result, { headers });
}

export async function PATCH(request: Request) {
  const body = await readJson(request);
  if (body === null) return NextResponse.json({ persisted: false }, { status: 400, headers });
  const result = await updateTodo(body);
  return NextResponse.json(result, { status: result.persisted ? 200 : 400, headers });
}
