import type { ReactNode } from "react";
import type { WeatherDayPart, WeatherView } from "@/data/types";
import { WeatherIcon } from "@/components/hjem/Meteogram";
import { dayPartRangeLabel, weatherTileStats } from "@/lib/weather-format";

function partIconColor(part: WeatherDayPart): string {
  if (part.symbol === "sun") return "var(--accent)";
  if (part.precipitating) return "var(--rain)";
  return "var(--text-2)";
}

function DayPartCard({ part, compact }: { part: WeatherDayPart; compact: boolean }) {
  const iconSize = compact ? 26 : 30;
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: compact ? 8 : 10,
        }}
      >
        {part.symbol ? (
          <WeatherIcon symbol={part.symbol} size={iconSize} color={partIconColor(part)} />
        ) : (
          <div style={{ width: iconSize, height: iconSize }} />
        )}
        {part.temperature != null ? (
          <div
            data-part-temp=""
            style={{
              fontFamily: "var(--font-data)",
              fontSize: compact ? 22 : 26,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            {part.temperature}°
          </div>
        ) : null}
      </div>
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
        minHeight: compact ? 0 : 180,
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
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
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
              display: "flex",
              alignItems: "center",
              padding: compact ? "5px 10px" : "6px 12px",
              borderRadius: "var(--r-full)",
              background: "var(--tile-2)",
              fontFamily: "var(--font-data)",
              fontSize: compact ? 12 : 13,
              lineHeight: 1,
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
          Stabekk · data fra Yr
        </div>
      </div>
      {note}
      <div className="weather-parts">
        {weather.parts.map((part) => (
          <DayPartCard key={part.id} part={part} compact={compact} />
        ))}
      </div>
    </section>
  );
}
