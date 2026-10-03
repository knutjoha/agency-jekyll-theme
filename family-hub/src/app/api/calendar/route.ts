import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/calendar";
import { fixturePayload } from "@/lib/calendar-view";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload =
    url.searchParams.get("snapshot") === "1"
      ? fixturePayload()
      : await getCalendar({ week: url.searchParams.get("week") });

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
