import type { CalendarDay, CalendarWeek } from "./types";

const empty = (): CalendarDay => ({ blocks: [] });

const emptyWeek = (): CalendarDay[] => [empty(), empty(), empty(), empty(), empty(), empty(), empty()];

export const calendarWeek: CalendarWeek = {
  startsOn: "2026-09-28",
  notice: "",
  rows: [
    {
      personId: "amelia",
      detail: "8A Ringstabekk",
      days: emptyWeek(),
    },
    {
      personId: "hedda",
      detail: "8B Ringstabekk",
      days: emptyWeek(),
    },
    {
      personId: "maja",
      detail: "6C Jar skole",
      days: emptyWeek(),
    },
    {
      personId: "knut",
      detail: "Pappa",
      days: emptyWeek(),
    },
    {
      personId: "ulla",
      detail: "Mamma",
      days: emptyWeek(),
    },
  ],
};
