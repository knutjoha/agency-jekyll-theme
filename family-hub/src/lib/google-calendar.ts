import type { CalendarEventInput } from "./calendar-view";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CACHE_MS = 5 * 60 * 1000;

export type GoogleCalendarCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
};

type TokenCache = {
  clientId: string;
  token: string;
  expiresAt: number;
};

type EventCache = {
  expiresAt: number;
  events: CalendarEventInput[];
};

let tokenCache: TokenCache | null = null;
const eventCache = new Map<string, EventCache>();

export function readGoogleCredentials(env: Record<string, string | undefined>): GoogleCalendarCredentials | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim() ?? "";
  const calendarId = env.GOOGLE_CALENDAR_ID?.trim() ?? "";
  if (!clientId || !clientSecret || !refreshToken || !calendarId) return null;
  return { clientId, clientSecret, refreshToken, calendarId };
}

async function accessToken(credentials: GoogleCalendarCredentials): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.clientId === credentials.clientId && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`token ${response.status}`);
  }
  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) {
    throw new Error("token missing");
  }
  tokenCache = {
    clientId: credentials.clientId,
    token: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000,
  };
  return payload.access_token;
}

async function fetchEvents(
  credentials: GoogleCalendarCredentials,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEventInput[]> {
  const token = await accessToken(credentials);
  const events: CalendarEventInput[] = [];
  let pageToken = "";

  for (let page = 0; page < 5; page += 1) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(credentials.calendarId)}/events`,
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeZone", "Europe/Oslo");
    url.searchParams.set("timeMin", timeMin.toISOString());
    url.searchParams.set("timeMax", timeMax.toISOString());
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("fields", "items(status,summary,description,start,end),nextPageToken");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 401) tokenCache = null;
      throw new Error(`calendar ${response.status}`);
    }
    const payload = (await response.json()) as {
      items?: CalendarEventInput[];
      nextPageToken?: string;
    };
    events.push(...(payload.items ?? []));
    if (!payload.nextPageToken) break;
    pageToken = payload.nextPageToken;
  }

  return events;
}

export async function listTeamVidveiEvents(
  credentials: GoogleCalendarCredentials,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEventInput[]> {
  const key = `${credentials.calendarId}|${timeMin.toISOString()}|${timeMax.toISOString()}`;
  const hit = eventCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.events;

  const events = await fetchEvents(credentials, timeMin, timeMax);
  eventCache.set(key, { expiresAt: Date.now() + CACHE_MS, events });
  return events;
}
