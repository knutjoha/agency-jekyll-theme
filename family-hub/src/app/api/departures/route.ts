import { NextResponse } from "next/server";
import { getDepartures } from "@/lib/departures";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const view = await getDepartures();
    return NextResponse.json(view, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "departures" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
