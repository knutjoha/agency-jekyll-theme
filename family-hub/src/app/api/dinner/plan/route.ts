import { NextResponse } from "next/server";
import { planDinner, type DinnerPlanBody } from "@/lib/dinner/plan";
import { bearerMatches, isOsloSunday } from "@/lib/dinner/week";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "no-store" };

function json(body: DinnerPlanBody, status: number) {
  return NextResponse.json(body, { status, headers });
}

function snapshotOf(request: Request): boolean {
  return new URL(request.url).searchParams.get("snapshot") === "1";
}

export async function GET(request: Request) {
  if (!bearerMatches(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return json({ persisted: false }, 401);
  }
  const now = new Date();
  if (!isOsloSunday(now)) return json({ persisted: false }, 200);
  const result = await planDinner({ scope: "week", now, snapshot: snapshotOf(request) });
  return json(result.body, result.status);
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return json({ persisted: false }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ persisted: false }, 400);
  const record = body as { scope?: unknown; week?: unknown; dayId?: unknown };
  const snapshot = snapshotOf(request);
  if (record.scope === "week") {
    const result = await planDinner({ scope: "week", snapshot });
    return json(result.body, result.status);
  }
  if (record.scope === "day" && typeof record.week === "string" && typeof record.dayId === "string") {
    const result = await planDinner({ scope: "day", week: record.week, dayId: record.dayId, snapshot });
    return json(result.body, result.status);
  }
  return json({ persisted: false }, 400);
}
