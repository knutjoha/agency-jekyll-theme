import type { ReactNode } from "react";
import type { MeteogramSlot, WeatherDayPart, WeatherView } from "@/data/types";
import { WeatherIcon } from "@/components/hjem/Meteogram";
import {
  dayPartRangeLabel,
  temperatureLineCaptions,
  weatherTileStats,
} from "@/lib/weather-format";

function partIconColor(part: WeatherDayPart): string {
  if (part.symbol === "sun") return "var(--accent)";
  if (part.precipitating) return "var(--rain)";
  return "var(--text-2)";
}

function TempPolyline({ slots }: { slots: MeteogramSlot[] }) {
  const captions = temperatureLineCaptions(slots);
  const temps = slots.map((slot) => slot.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(2, max - min);
  const width = 100;
  const height = 36;
  const padY = 5;
  const points = slots
    .map((slot, index) => {
      const x = slots.length === 1 ? width / 2 : (index / (slots.length - 1)) * width;
      const y = padY + (1 - (slot.temperature - min) / span) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div data-region="temp-line" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Temperatur ${captions.left} til ${captions.right}`}
        style={{ width: "100%", height: 44, display: "block", overflow: "visible" }}
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          data-line="start"
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {captions.left}
        </span>
        <span
          data-line="high"
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
            textAlign: "right",
          }}
        >
          {captions.right}
        </span>
      </div>
    </div>
  );
}

function DayPartCard({ part, compact }: { part: WeatherDayPart; compact: boolean }) {
  return (
    <article
      data-part={part.id}
      style={{
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 6 : 7,
        padding: compact ? "12px 8px" : "16px 10px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-2)",
        textAlign: "center",
      }}
    >
      {part.symbol ? (
        <WeatherIcon symbol={part.symbol} size={compact ? 28 : 32} color={partIconColor(part)} />
      ) : (
        <div style={{ width: compact ? 28 : 32, height: compact ? 28 : 32 }} />
      )}
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: compact ? 15 : 16,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {part.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-data)",
          fontSize: compact ? 11 : 12,
          lineHeight: 1.2,
          fontWeight: 400,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {dayPartRangeLabel(part.startHour, part.endHour)}
      </div>
      {part.condition ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 12 : 13,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {part.condition}
        </div>
      ) : null}
    </article>
  );
}

export function WeatherTile({
  weather,
  note,
  compact = false,
}: {
  weather: WeatherView;
  note?: ReactNode;
  compact?: boolean;
}) {
  const stats = weatherTileStats(weather.dayLow, weather.dayHigh, weather.dayPrecipMm);

  return (
    <section
      data-region="weather"
      data-weather-source={weather.source}
      className="weather-tile"
      style={{
        width: "100%",
        minHeight: compact ? 0 : 200,
        height: "auto",
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 12 : 14,
        padding: compact ? 16 : 24,
        borderRadius: "var(--r-tile)",
        background: "var(--tile)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: 10,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: compact ? 20 : 22,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            Været i dag
          </div>
          <div
            data-weather-stats=""
            style={{
              fontFamily: "var(--font-data)",
              fontSize: compact ? 12 : 13,
              lineHeight: 1.2,
              fontWeight: 400,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {stats}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text-muted)",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          Stabekk
        </div>
      </div>
      {note}
      <div className="weather-parts">
        {weather.parts.map((part) => (
          <DayPartCard key={part.id} part={part} compact={compact} />
        ))}
      </div>
      <TempPolyline slots={weather.slots} />
    </section>
  );
}
