import type { CalendarDay, CalendarWeek } from "./types";

const empty = (): CalendarDay => ({ blocks: [] });

const routine = (label: string, ...activities: CalendarDay["blocks"]): CalendarDay => ({
  blocks: [{ kind: "routine", label }, ...activities],
});

const activity = (
  time: string,
  title: string,
  warning?: string,
): CalendarDay["blocks"][number] => ({
  kind: "activity",
  time,
  title,
  ...(warning ? { warning } : {}),
});

export const calendarWeek: CalendarWeek = {
  startsOn: "2026-09-28",
  notice: "Neste uke: høstferie",
  rows: [
    {
      personId: "amelia",
      detail: "8A Ringstabekk",
      days: [
        routine("Skole", activity("17:00", "Håndball")),
        routine("Skole"),
        routine("Skole", activity("18:00", "Teater")),
        routine("Skole", activity("17:00", "Håndball")),
        routine("Skole"),
        {
          conflict: true,
          blocks: [activity("11:00", "Kamp"), activity("14:00", "Teater", "sjåfør")],
        },
        empty(),
      ],
    },
    {
      personId: "hedda",
      detail: "8B Ringstabekk",
      days: [
        routine("Skole", activity("17:00", "Håndball")),
        routine("Skole"),
        routine("Skole"),
        routine("Skole", activity("17:00", "Håndball")),
        routine("Skole"),
        { blocks: [activity("13:00", "Kamp")] },
        empty(),
      ],
    },
    {
      personId: "maja",
      detail: "6C Jar skole",
      days: [
        routine("Skole"),
        routine("Skole", activity("17:30", "Cheer")),
        routine("Skole"),
        routine("Skole", activity("17:30", "Cheer")),
        routine("Skole"),
        { blocks: [activity("10:00", "Stevne")] },
        empty(),
      ],
    },
    {
      personId: "knut",
      detail: "Pappa",
      days: [
        routine("Kontor"),
        routine("Kontor", activity("06:30", "Trening")),
        routine("Kontor"),
        routine("Kontor", activity("06:30", "Trening")),
        routine("Kontor"),
        { blocks: [activity("08:00", "Trening"), activity("19:30", "Familiekveld")] },
        { blocks: [activity("16:00", "Pakke til hytta")] },
      ],
    },
    {
      personId: "ulla",
      detail: "Mamma",
      days: [
        routine("Arbeid"),
        routine("Arbeid"),
        routine("Arbeid"),
        routine("Arbeid"),
        routine("Arbeid"),
        { blocks: [activity("19:30", "Familiekveld")] },
        empty(),
      ],
    },
  ],
};
