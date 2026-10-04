export const SNAPSHOT_AT = new Date("2026-10-03T05:42:00.000Z");

export type OsloNow = {
  time: string;
  weekdayLine: string;
  numericDate: string;
  weekLabel: string;
  hour: number;
  minute: number;
};

type OsloParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((entry) => entry.type === type)?.value ?? "";
}

export function osloParts(date: Date): OsloParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  let hour = Number(part(parts, "hour"));
  if (hour === 24) hour = 0;

  return {
    year: Number(part(parts, "year")),
    month: Number(part(parts, "month")),
    day: Number(part(parts, "day")),
    hour,
    minute: Number(part(parts, "minute")),
  };
}

export function osloDateKey(date: Date): string {
  const parts = osloParts(date);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("nb-NO") + value.slice(1);
}

export function isoWeekNumber(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatOslo(date: Date): OsloNow {
  const parts = osloParts(date);
  const weekday = capitalize(
    new Intl.DateTimeFormat("nb-NO", {
      timeZone: "Europe/Oslo",
      weekday: "long",
    }).format(date),
  );
  const monthName = new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    month: "long",
  }).format(date);
  const dd = String(parts.day).padStart(2, "0");
  const mm = String(parts.month).padStart(2, "0");
  const hh = String(parts.hour).padStart(2, "0");
  const min = String(parts.minute).padStart(2, "0");

  return {
    time: `${hh}:${min}`,
    weekdayLine: `${weekday} ${parts.day}. ${monthName}`,
    numericDate: `${dd}.${mm}.${parts.year}`,
    weekLabel: `Uke ${isoWeekNumber(parts.year, parts.month, parts.day)}`,
    hour: parts.hour,
    minute: parts.minute,
  };
}

/** UTC instant of 00:00 on a calendar date in Europe/Oslo, including daylight-saving changes. */
export function osloMidnightUtc(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const target = utc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = osloParts(new Date(utc));
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const diff = asUtc - target;
    if (diff === 0) return new Date(utc);
    utc -= diff;
  }
  return new Date(utc);
}

export function meteogramNowHour(hour: number): number {
  if (hour < 8) return 8;
  if (hour >= 22) return 22;
  return hour - (hour % 2);
}
