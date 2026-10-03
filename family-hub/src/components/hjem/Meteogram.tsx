import {
  Cloud,
  CloudDrizzle,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import type { WeatherSymbol, WeatherView } from "@/data/types";

const icons: Record<WeatherSymbol, LucideIcon> = {
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-moon": CloudMoon,
  moon: Moon,
};

export function WeatherIcon({
  symbol,
  size,
  color,
}: {
  symbol: WeatherSymbol;
  size: number;
  color: string;
}) {
  const Icon = icons[symbol];
  return <Icon size={size} color={color} />;
}

export function Meteogram({
  slots,
  nowHour,
}: {
  slots: WeatherView["slots"];
  nowHour: number;
}) {
  return (
    <div
      data-region="meteogram"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {slots.map((slot) => {
          const current = slot.hour === nowHour;
          return (
            <div
              key={slot.hour}
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "6px 0",
                borderRadius: "var(--r-nested)",
                background: current ? "var(--tile-2)" : "transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  flexShrink: 0,
                }}
              >
                <WeatherIcon
                  symbol={slot.symbol}
                  size={24}
                  color={slot.precipitating ? "var(--rain)" : "var(--text-2)"}
                />
                <div
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 17,
                    lineHeight: 1,
                    fontWeight: 400,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {slot.temperature}°
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                {slot.barPx > 0 ? (
                  <div
                    style={{
                      width: 20,
                      height: slot.barPx,
                      borderRadius: 3,
                      background: "var(--rain)",
                      flexShrink: 0,
                    }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          flexShrink: 0,
          background: "color-mix(in srgb, var(--text) 10%, transparent)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          width: "100%",
        }}
      >
        {slots.map((slot) => {
          const current = slot.hour === nowHour;
          return (
            <div
              key={slot.hour}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                fontFamily: "var(--font-data)",
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 400,
                color: current ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {current ? "nå" : slot.hour}
            </div>
          );
        })}
      </div>
    </div>
  );
}
