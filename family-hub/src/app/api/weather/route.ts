import { NextResponse } from "next/server";
import { fixtureWeather } from "@/data/fixture";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const fail = new URL(request.url).searchParams.get("fail") === "1";
  if (fail) {
    return NextResponse.json(fixtureWeather, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { view, maxAge } = await getWeather();
  return NextResponse.json(view, {
    headers: {
      "Cache-Control": view.source === "fixture" ? "no-store" : `public, max-age=${maxAge}`,
    },
  });
}
