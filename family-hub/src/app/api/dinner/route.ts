import { NextResponse } from "next/server";
import { loadDinner, saveDinner } from "@/lib/household/store";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json(await loadDinner(), { headers });
}

export async function PATCH(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ persisted: false }, { status: 400, headers });
  }
  const result = await saveDinner(body);
  return NextResponse.json(result, { status: result.persisted ? 200 : 400, headers });
}
