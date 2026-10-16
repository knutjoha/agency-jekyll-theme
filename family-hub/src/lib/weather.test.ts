import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtureWeather } from "../data/fixture.ts";
import { isWeatherView } from "./home-cache.ts";
import { osloParts } from "./oslo.ts";
import { weatherTileStats } from "./weather-format.ts";
import { buildWeather, mapDayPartSymbol, mapSymbol } from "./weather.ts";

function atOslo(hour: number): string {
  return new Date(Date.UTC(2026, 9, 15, 22 + hour, 0, 0)).toISOString();
}

function hour(
  clock: number,
  temperature: number,
  precipMm: number,
  symbol: string,
) {
  return {
    time: atOslo(clock),
    data: {
      instant: { details: { air_temperature: temperature } },
      next_1_hours: {
        summary: { symbol_code: symbol },
        details: { precipitation_amount: precipMm },
      },
    },
  };
}

const cropDay = [
  hour(6, 2, 0, "cloudy"),
  hour(8, 3, 0.4, "rain"),
  hour(9, 3, 0.4, "rain"),
  hour(10, 4, 0.4, "rain"),
  hour(11, 4, 0, "rain"),
  hour(12, 5, 0.2, "drizzle"),
  hour(13, 5, 0.1, "drizzle"),
  hour(14, 6, 0.1, "drizzle"),
  hour(15, 6, 0, "clearsky_day"),
  hour(16, 7, 0, "clearsky_day"),
  hour(17, 7, 0, "clearsky_day"),
  hour(18, 6, 0, "cloudy"),
  hour(19, 5, 0, "clearsky_night"),
  hour(20, 5, 0, "clearsky_night"),
  hour(21, 4, 0, "clearsky_night"),
  hour(22, 4, 0, "clearsky_night"),
];

const morning = new Date("2026-10-16T08:00:00.000Z");

test("buckets waking-day hours into Morgen, Formiddag, Ettermiddag, and Kveld", () => {
  const view = buildWeather(cropDay, morning);
  assert.deepEqual(
    view.parts.map((part) => [part.id, part.temperature, part.condition, part.symbol]),
    [
      ["morgen", 4, "Regn 1,2 mm", "cloud-rain"],
      ["formiddag", 6, "Yr", "cloud-drizzle"],
      ["ettermiddag", 7, "Sol", "sun"],
      ["kveld", 5, "Klart", "moon"],
    ],
  );
  assert.equal(weatherTileStats(view.dayLow, view.dayHigh, view.dayPrecipMm), "2–7 °C · 1,6 mm");
  assert.equal(view.slots.length, 8);
  assert.equal(isWeatherView(view), true);
});

test("the page header still says Klarvær, not Sol", () => {
  const view = buildWeather(cropDay, new Date("2026-10-16T14:00:00.000Z"));
  assert.match(view.summary, /Klarvær/);
  assert.equal(mapSymbol("clearsky_day").condition, "Klarvær");
  assert.equal(mapSymbol("clearsky_day").symbol, "cloud-sun");
  assert.deepEqual(mapDayPartSymbol("clearsky_day"), {
    symbol: "sun",
    precipitating: false,
    condition: "Sol",
  });
  assert.deepEqual(mapDayPartSymbol("clearsky_night"), {
    symbol: "moon",
    precipitating: false,
    condition: "Klart",
  });
});

test("a missing morning window keeps the card without a condition", () => {
  const later = cropDay.filter((entry) => {
    const clock = osloParts(new Date(entry.time)).hour;
    return clock < 8 || clock > 11;
  });
  const view = buildWeather(later, morning);
  assert.equal(view.parts[0]?.id, "morgen");
  assert.equal(view.parts[0]?.condition, "");
  assert.equal(view.parts[0]?.symbol, null);
  assert.equal(view.parts[0]?.temperature, null);
  assert.equal(view.parts[2]?.condition, "Sol");
});

test("a dry day writes 0 mm and short sky words", () => {
  const dry = [
    hour(8, 3, 0, "clearsky_day"),
    hour(12, 5, 0, "fair_day"),
    hour(16, 7, 0, "clearsky_day"),
    hour(20, 4, 0, "clearsky_night"),
  ];
  const view = buildWeather(dry, morning);
  assert.equal(weatherTileStats(view.dayLow, view.dayHigh, view.dayPrecipMm), "3–7 °C · 0 mm");
  assert.equal(view.parts[0]?.condition, "Sol");
  assert.equal(view.parts[1]?.condition, "Delvis skyet");
  assert.equal(view.parts[3]?.condition, "Klart");
  assert.ok(!view.parts.some((part) => part.condition.includes("mm")));
});

test("cached weather without the four parts is not a valid view", () => {
  const { parts, dayLow, dayHigh, dayPrecipMm, ...legacy } = fixtureWeather;
  assert.equal(isWeatherView(fixtureWeather), true);
  assert.equal(isWeatherView(legacy), false);
  assert.ok(parts.length === 4 && dayLow === 2 && dayHigh === 7 && dayPrecipMm === 1.6);
});
