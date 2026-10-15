import { formatOslo } from "./oslo";

/**
 * IDs checked against Entur Journey Planner on 2026-10-15.
 * Stabekk stasjon is NSR:StopPlace:59654. Platform 2 (toward Oslo) is NSR:Quay:1150.
 * Service journeys name Skøyen stasjon as NSR:StopPlace:152. The geocoder also
 * returns NSR:StopPlace:59651 for that station; passingTimes and estimatedCalls do not.
 */
export const ENTUR_JOURNEY_PLANNER_URL = "https://api.entur.io/journey-planner/v3/graphql";
export const ENTUR_CLIENT_NAME = "knutjoha-familyhub";

export const L1_LINE_ID = "VYG:Line:L1";
export const L1_QUAY_ID = "NSR:Quay:1150";
export const BUS_150_LINE_ID = "RUT:Line:150";
export const BUS_150_QUAY_ID = "NSR:Quay:6710";
export const SKOYEN_STOP_PLACE_ID = "NSR:StopPlace:152";
export const SKOYEN_STOP_PLACE_IDS = [SKOYEN_STOP_PLACE_ID, "NSR:StopPlace:59651"] as const;

export const DEPARTURE_ROW_COUNT = 3;
const CANDIDATE_COUNT = 8;

export type DepartureLine = "L1" | "150";

export type Departure = {
  id: string;
  line: DepartureLine;
  destination: string;
  aimed: string;
  expected: string;
  cancelled: boolean;
};

export type DeparturesView = {
  rows: Departure[];
};

export type StopPoint = {
  quay?: { stopPlace?: { id?: string | null } | null } | null;
};

export type EstimatedCall = {
  aimedDepartureTime?: string | null;
  expectedDepartureTime?: string | null;
  cancellation?: boolean | null;
  destinationDisplay?: { frontText?: string | null } | null;
  serviceJourney?: {
    id?: string | null;
    line?: { id?: string | null } | null;
    passingTimes?: StopPoint[] | null;
    estimatedCalls?: StopPoint[] | null;
  } | null;
};

export type DepartureTone = "ontime" | "delayed" | "cancelled";

export type DepartureDisplay = {
  time: string;
  delayLabel: string | null;
  untilLabel: string | null;
  cancelled: boolean;
  tone: DepartureTone;
};

const LINE_IDS = new Set<DepartureLine>(["L1", "150"]);
const SKOYEN_IDS = new Set<string>(SKOYEN_STOP_PLACE_IDS);

export const DEPARTURES_QUERY = `query FamilyHubDepartures {
  l1: quay(id: "${L1_QUAY_ID}") {
    estimatedCalls(
      numberOfDepartures: ${CANDIDATE_COUNT}
      whiteListedModes: [rail]
      whiteListed: { lines: ["${L1_LINE_ID}"] }
    ) {
      aimedDepartureTime
      expectedDepartureTime
      cancellation
      destinationDisplay { frontText }
      serviceJourney {
        id
        line { id }
        passingTimes { quay { stopPlace { id } } }
        estimatedCalls { quay { stopPlace { id } } }
      }
    }
  }
  bus: quay(id: "${BUS_150_QUAY_ID}") {
    estimatedCalls(
      numberOfDepartures: ${CANDIDATE_COUNT}
      whiteListedModes: [bus]
      whiteListed: { lines: ["${BUS_150_LINE_ID}"] }
    ) {
      aimedDepartureTime
      expectedDepartureTime
      cancellation
      destinationDisplay { frontText }
      serviceJourney { id line { id } }
    }
  }
}`;

export type LineDepartures = {
  line: DepartureLine;
  destination: string;
  departures: Departure[];
};

const LINE_ORDER: DepartureLine[] = ["L1", "150"];
const LINE_DESTINATION: Record<DepartureLine, string> = {
  L1: "Lillestrøm",
  "150": "Nationaltheatret",
};

/** Frozen hallway clock is 07:42 Europe/Oslo. Each line keeps three upcoming trips; a fourth stays off. */
export const fixtureDepartures: DeparturesView = {
  rows: [
    {
      id: "l1-past",
      line: "L1",
      destination: "Lillestrøm",
      aimed: "2026-10-03T05:10:00.000Z",
      expected: "2026-10-03T05:10:00.000Z",
      cancelled: false,
    },
    {
      id: "l1-on",
      line: "L1",
      destination: "Lillestrøm",
      aimed: "2026-10-03T05:56:00.000Z",
      expected: "2026-10-03T05:56:00.000Z",
      cancelled: false,
    },
    {
      id: "l1-delay",
      line: "L1",
      destination: "Lillestrøm",
      aimed: "2026-10-03T06:14:00.000Z",
      expected: "2026-10-03T06:16:00.000Z",
      cancelled: false,
    },
    {
      id: "l1-cancel",
      line: "L1",
      destination: "Lillestrøm",
      aimed: "2026-10-03T06:40:00.000Z",
      expected: "2026-10-03T06:40:00.000Z",
      cancelled: true,
    },
    {
      id: "l1-later",
      line: "L1",
      destination: "Lillestrøm",
      aimed: "2026-10-03T07:10:00.000Z",
      expected: "2026-10-03T07:10:00.000Z",
      cancelled: false,
    },
    {
      id: "bus-past",
      line: "150",
      destination: "Nationaltheatret",
      aimed: "2026-10-03T05:30:00.000Z",
      expected: "2026-10-03T05:30:00.000Z",
      cancelled: false,
    },
    {
      id: "bus-delay",
      line: "150",
      destination: "Nationaltheatret",
      aimed: "2026-10-03T05:46:00.000Z",
      expected: "2026-10-03T05:49:00.000Z",
      cancelled: false,
    },
    {
      id: "bus-cancel",
      line: "150",
      destination: "Nationaltheatret",
      aimed: "2026-10-03T06:05:00.000Z",
      expected: "2026-10-03T06:05:00.000Z",
      cancelled: true,
    },
    {
      id: "bus-on",
      line: "150",
      destination: "Nationaltheatret",
      aimed: "2026-10-03T06:22:00.000Z",
      expected: "2026-10-03T06:22:00.000Z",
      cancelled: false,
    },
    {
      id: "bus-later",
      line: "150",
      destination: "Nationaltheatret",
      aimed: "2026-10-03T06:45:00.000Z",
      expected: "2026-10-03T06:45:00.000Z",
      cancelled: false,
    },
  ],
};

function stopId(point: StopPoint | null | undefined): string {
  return point?.quay?.stopPlace?.id ?? "";
}

export function callsAtSkoyen(call: EstimatedCall): boolean {
  const journey = call.serviceJourney;
  if (!journey) return false;
  const points = [...(journey.passingTimes ?? []), ...(journey.estimatedCalls ?? [])];
  return points.some((point) => SKOYEN_IDS.has(stopId(point)));
}

function toDeparture(call: EstimatedCall, line: DepartureLine): Departure | null {
  const journey = call.serviceJourney;
  const aimed = call.aimedDepartureTime ?? "";
  const expected = call.expectedDepartureTime || aimed;
  const destination = call.destinationDisplay?.frontText?.trim() ?? "";
  if (!journey?.id || !aimed || !destination) return null;
  return {
    id: `${journey.id}@${aimed}`,
    line,
    destination,
    aimed,
    expected,
    cancelled: call.cancellation === true,
  };
}

export function l1Departures(calls: EstimatedCall[]): Departure[] {
  const rows: Departure[] = [];
  for (const call of calls) {
    if (call.serviceJourney?.line?.id !== L1_LINE_ID) continue;
    if (!callsAtSkoyen(call)) continue;
    const row = toDeparture(call, "L1");
    if (row) rows.push(row);
  }
  return rows;
}

export function bus150Departures(calls: EstimatedCall[]): Departure[] {
  const rows: Departure[] = [];
  for (const call of calls) {
    if (call.serviceJourney?.line?.id !== BUS_150_LINE_ID) continue;
    const destination = call.destinationDisplay?.frontText ?? "";
    if (!/nationaltheatret/i.test(destination)) continue;
    const row = toDeparture(call, "150");
    if (row) rows.push(row);
  }
  return rows;
}

export function departureInstant(departure: Departure): number {
  const parsed = Date.parse(departure.expected || departure.aimed);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

/** Whole minutes, expected minus aimed. Negative means early. */
export function delayMinutes(aimed: string, expected: string): number {
  const delta = Date.parse(expected) - Date.parse(aimed);
  if (!Number.isFinite(delta)) return 0;
  return Math.round(delta / 60_000);
}

/** Countdown from expected departure. Under a minute is "nå". */
export function untilLabel(expected: string, now: Date): string | null {
  const parsed = Date.parse(expected);
  if (!Number.isFinite(parsed)) return null;
  const remaining = parsed - now.getTime();
  if (remaining < 60_000) return "nå";
  return `om ${Math.round(remaining / 60_000)} min`;
}

export function departureDisplay(departure: Departure, now: Date): DepartureDisplay {
  const when = departure.cancelled ? departure.aimed : departure.expected || departure.aimed;
  const parsed = new Date(when);
  const time = Number.isNaN(parsed.getTime()) ? "—" : formatOslo(parsed).time;
  if (departure.cancelled) {
    return { time, delayLabel: "Innstilt", untilLabel: null, cancelled: true, tone: "cancelled" };
  }
  const delay = delayMinutes(departure.aimed, departure.expected);
  const until = untilLabel(departure.expected || departure.aimed, now);
  if (delay >= 1) {
    return { time, delayLabel: `+${delay} min`, untilLabel: until, cancelled: false, tone: "delayed" };
  }
  return { time, delayLabel: null, untilLabel: until, cancelled: false, tone: "ontime" };
}

function upcomingDepartures(rows: Departure[], now: Date): Departure[] {
  const cutoff = now.getTime();
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.id) || departureInstant(row) < cutoff) return false;
      seen.add(row.id);
      return true;
    })
    .sort((left, right) => departureInstant(left) - departureInstant(right));
}

/** Next three departures for L1, then the next three for bus 150. */
export function selectDepartureLines(rows: Departure[], now: Date, limit = DEPARTURE_ROW_COUNT): LineDepartures[] {
  const upcoming = upcomingDepartures(rows, now);
  return LINE_ORDER.map((line) => {
    const departures = upcoming.filter((row) => row.line === line).slice(0, limit);
    return {
      line,
      destination: departures[0]?.destination ?? LINE_DESTINATION[line],
      departures,
    };
  });
}

export function isDeparture(value: unknown): value is Departure {
  if (!value || typeof value !== "object") return false;
  const row = value as Departure;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    LINE_IDS.has(row.line) &&
    typeof row.destination === "string" &&
    row.destination.length > 0 &&
    typeof row.aimed === "string" &&
    row.aimed.length > 0 &&
    typeof row.expected === "string" &&
    row.expected.length > 0 &&
    typeof row.cancelled === "boolean"
  );
}

export function isDeparturesView(value: unknown): value is DeparturesView {
  if (!value || typeof value !== "object") return false;
  const view = value as DeparturesView;
  return Array.isArray(view.rows) && view.rows.length <= 24 && view.rows.every(isDeparture);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCalls(quay: unknown): EstimatedCall[] | null {
  if (!isRecord(quay) || !Array.isArray(quay.estimatedCalls)) return null;
  return quay.estimatedCalls.filter(isRecord) as EstimatedCall[];
}

export function departuresFromEntur(body: unknown): DeparturesView | null {
  if (!isRecord(body) || !isRecord(body.data)) return null;
  const l1 = readCalls(body.data.l1);
  const bus = readCalls(body.data.bus);
  if (!l1 || !bus) return null;
  return { rows: [...l1Departures(l1), ...bus150Departures(bus)] };
}

export async function getDepartures(fetchImpl: typeof fetch = fetch): Promise<DeparturesView> {
  const response = await fetchImpl(ENTUR_JOURNEY_PLANNER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ET-Client-Name": ENTUR_CLIENT_NAME,
    },
    body: JSON.stringify({ query: DEPARTURES_QUERY }),
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`Entur ${response.status}`);
  const view = departuresFromEntur(await response.json());
  if (!view) throw new Error("Entur departures");
  return view;
}
