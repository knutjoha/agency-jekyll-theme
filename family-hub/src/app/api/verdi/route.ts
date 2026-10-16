import { NextResponse } from "next/server";
import { createExtra, deleteExtra, loadVerdi, lockWeek, saveBasic, saveSkip, updateExtra } from "@/lib/verdi/store";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  const loaded = await loadVerdi();
  return NextResponse.json(loaded, { headers });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return NextResponse.json({ persisted: false }, { status: 400, headers });
  const result = await createExtra(body);
  return NextResponse.json(result, { headers });
}

export async function PATCH(request: Request) {
  const body = await readJson(request);
  if (body === null || !isRecord(body)) return NextResponse.json({ persisted: false }, { status: 400, headers });
  const op = body.op;
  const result =
    op === "skip"
      ? await saveSkip(body)
      : op === "extra"
        ? await updateExtra(body)
        : op === "basic"
          ? await saveBasic(body)
          : op === "lock"
            ? await lockWeek(body)
            : { persisted: false };
  return NextResponse.json(result, { status: result.persisted ? 200 : 400, headers });
}

export async function DELETE(request: Request) {
  const body = await readJson(request);
  if (body === null) return NextResponse.json({ persisted: false }, { status: 400, headers });
  const result = await deleteExtra(body);
  return NextResponse.json(result, { status: result.persisted ? 200 : 400, headers });
}
