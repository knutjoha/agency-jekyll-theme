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
  return `${low}–${high} °C · ${precip}`;
}
