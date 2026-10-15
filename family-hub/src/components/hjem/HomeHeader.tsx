import type { WeatherView } from "@/data/types";
import type { OsloNow } from "@/lib/oslo";
import { WeatherIcon } from "@/components/hjem/Meteogram";

export function HomeHeader({
  clock,
  weather,
  pending = false,
}: {
  clock: OsloNow;
  weather: WeatherView;
  pending?: boolean;
}) {
  return (
    <header
      data-region="header"
      style={{
        minHeight: 120,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "0 8px",
        minWidth: 0,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", minWidth: 0, flex: "1 1 auto" }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: 2,
            color: "var(--text-muted)",
          }}
        >
          FAMILIEN VIDVEI
        </div>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 3.2vw, 42px)",
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          {clock.weekdayLine}
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
          {pending ? (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--text-muted)",
              }}
            >
              Henter været
            </div>
          ) : (
            <>
              <WeatherIcon symbol={weather.headerSymbol} size={21} color="var(--text-2)" />
              <div
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 20,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--text)",
                }}
              >
                {weather.temperature}°
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {weather.summary}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div
          style={{
            padding: "8px 16px",
            borderRadius: "var(--r-full)",
            background: "var(--tile-2)",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-2)",
            whiteSpace: "nowrap",
          }}
        >
          {clock.weekLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--font-data)",
            fontSize: "clamp(36px, 4vw, 52px)",
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
            whiteSpace: "nowrap",
          }}
        >
          {clock.time}
        </div>
      </div>
    </header>
  );
}
