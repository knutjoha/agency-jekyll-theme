import { WeatherIcon } from "@/components/hjem/Meteogram";
import type { WeatherView } from "@/data/types";
import type { OsloNow } from "@/lib/oslo";

export function PhoneHeader({ clock, weather }: { clock: OsloNow; weather: WeatherView }) {
  return (
    <header data-region="header" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: "1.8px",
          color: "var(--text-muted)",
        }}
      >
        FAMILIEN VIDVEI
      </div>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 27,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {clock.weekdayLine}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingTop: 3,
          minWidth: 0,
        }}
      >
        <WeatherIcon symbol={weather.headerSymbol} size={16} color="var(--text-2)" />
        <div
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 15,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
            flexShrink: 0,
          }}
        >
          {weather.temperature}°
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text-muted)",
            minWidth: 0,
          }}
        >
          {weather.summary}
        </div>
      </div>
    </header>
  );
}
