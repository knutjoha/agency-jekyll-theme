import type { WeatherView } from "@/data/types";
import { Meteogram } from "@/components/hjem/Meteogram";

export function WeatherTile({ weather, nowHour }: { weather: WeatherView; nowHour: number }) {
  return (
    <section
      data-region="weather"
      style={{
        width: "100%",
        height: 200,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 24,
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
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            Været i dag
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              padding: "6px 12px",
              borderRadius: "var(--r-full)",
              background: "var(--tile-2)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "var(--r-full)",
                background: "var(--rain)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--text-2)",
                whiteSpace: "nowrap",
              }}
            >
              {weather.precipLabel}
            </span>
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
            whiteSpace: "nowrap",
          }}
        >
          {weather.attribution}
        </div>
      </div>
      <Meteogram slots={weather.slots} nowHour={nowHour} />
    </section>
  );
}
