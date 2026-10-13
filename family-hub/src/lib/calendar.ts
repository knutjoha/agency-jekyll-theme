import {
  addIsoDays,
  buildLivePayload,
  fixturePayload,
  mondayOf,
  parseIsoDate,
  SOON_HORIZON_DAYS,
} from "@/lib/calendar-view";
import { listTeamVidveiEvents, readGoogleCredentials } from "@/lib/google-calendar";
import type { CalendarPayload } from "@/data/types";
import { osloDateKey, osloMidnightUtc } from "@/lib/oslo";

function logCalendarFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  if (/ya29\.|access_token|refresh_token|client_secret|client_id/i.test(message)) {
    console.error("Team Vidvei read failed");
    return;
  }
  console.error(`Team Vidvei read failed: ${message}`);
}

export async function getCalendar(options?: { week?: string | null; now?: Date }): Promise<CalendarPayload> {
  const now = options?.now ?? new Date();
  const credentials = readGoogleCredentials(process.env);
  if (!credentials) return fixturePayload();

  const todayWeek = mondayOf(osloDateKey(now));
  const requested = options?.week ? parseIsoDate(options.week) : null;
  const weekStart = requested ? mondayOf(requested) : todayWeek;

  try {
    const today = osloDateKey(now);
    const soonEnd = addIsoDays(today, SOON_HORIZON_DAYS);
    const needTodayWeek = weekStart !== todayWeek;
    const [weekEvents, upcomingEvents, extraToday] = await Promise.all([
      listTeamVidveiEvents(
        credentials,
        osloMidnightUtc(weekStart),
        osloMidnightUtc(addIsoDays(weekStart, 7)),
      ),
      listTeamVidveiEvents(credentials, osloMidnightUtc(today), osloMidnightUtc(soonEnd)),
      needTodayWeek
        ? listTeamVidveiEvents(
            credentials,
            osloMidnightUtc(todayWeek),
            osloMidnightUtc(addIsoDays(todayWeek, 7)),
          )
        : Promise.resolve(null),
    ]);
    const todayEvents = extraToday ?? weekEvents;
    return buildLivePayload(weekEvents, todayEvents, now, weekStart, upcomingEvents);
  } catch (error) {
    logCalendarFailure(error);
    return fixturePayload();
  }
}
