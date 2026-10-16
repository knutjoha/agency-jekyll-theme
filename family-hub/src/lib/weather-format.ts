import type { MeteogramSlot } from "../data/types";

export function formatMm(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1).replace(".", ",");
}

export function formatHourClock(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function dayPartRangeLabel(startHour: number, endHour: number): string {
  return `${formatHourClock(startHour)} – ${formatHourClock(endHour)}`;
}

export function weatherTileStats(low: number, high: number, precipMm: number): string {
  const precip = precipMm < 0.05 ? "0 mm" : `${formatMm(precipMm)} mm`;
  return `${low}–${high}°C · ${precip}`;
}

export function temperatureLineCaptions(slots: MeteogramSlot[]): { left: string; right: string } {
  const start = slots[0];
  const high = slots.reduce((best, slot) => (slot.temperature > best.temperature ? slot : best));
  return {
    left: `${start.temperature}°C kl. ${formatHourClock(start.hour)}`,
    right: `${high.temperature}°C kl. ${formatHourClock(high.hour)}`,
  };
}
