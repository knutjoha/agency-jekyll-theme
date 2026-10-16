import assert from "node:assert/strict";
import { test } from "node:test";
import { SNAPSHOT_AT } from "./oslo.ts";
import {
  BUS_150_LINE_ID,
  BUS_150_QUAY_ID,
  DEPARTURES_QUERY,
  ENTUR_CLIENT_NAME,
  L1_LINE_ID,
  L1_QUAY_ID,
  L2_LINE_ID,
  R21_LINE_ID,
  SKOYEN_STOP_PLACE_ID,
  bus150Departures,
  callsAtSkoyen,
  delayMinutes,
  departureDisplay,
  departuresFromEntur,
  untilLabel,
  fixtureDepartures,
  getDepartures,
  l1Departures,
  l2Departures,
  r21Departures,
  selectDepartureLines,
  type EstimatedCall,
} from "./departures.ts";

function call(partial: EstimatedCall): EstimatedCall {
  return partial;
}

function skoyen(id: string) {
  return { quay: { stopPlace: { id } } };
}

test("the journey query uses the verified Stabekk quays and line ids", () => {
  assert.equal(SKOYEN_STOP_PLACE_ID, "NSR:StopPlace:152");
  assert.match(DEPARTURES_QUERY, new RegExp(L1_QUAY_ID));
  assert.match(DEPARTURES_QUERY, new RegExp(L1_LINE_ID));
  assert.match(DEPARTURES_QUERY, new RegExp(L2_LINE_ID));
  assert.match(DEPARTURES_QUERY, new RegExp(R21_LINE_ID));
  assert.match(DEPARTURES_QUERY, new RegExp(BUS_150_QUAY_ID));
  assert.match(DEPARTURES_QUERY, new RegExp(BUS_150_LINE_ID));
  assert.match(DEPARTURES_QUERY, /passingTimes/);
  assert.match(DEPARTURES_QUERY, /estimatedCalls/);
  assert.equal((DEPARTURES_QUERY.match(new RegExp(L1_QUAY_ID, "g")) ?? []).length, 3);
});

test("L1 keeps only journeys that call at Skøyen", () => {
  const viaPassing = call({
    aimedDepartureTime: "2026-10-15T09:10:00+02:00",
    expectedDepartureTime: "2026-10-15T09:10:00+02:00",
    cancellation: false,
    destinationDisplay: { frontText: "Lillestrøm" },
    serviceJourney: {
      id: "VYG:ServiceJourney:keep",
      line: { id: L1_LINE_ID },
      passingTimes: [skoyen("NSR:StopPlace:706"), skoyen(SKOYEN_STOP_PLACE_ID)],
    },
  });
  const viaEstimated = call({
    aimedDepartureTime: "2026-10-15T09:40:00+02:00",
    expectedDepartureTime: "2026-10-15T09:40:00+02:00",
    destinationDisplay: { frontText: "Lillestrøm" },
    serviceJourney: {
      id: "VYG:ServiceJourney:estimated",
      line: { id: L1_LINE_ID },
      passingTimes: [],
      estimatedCalls: [skoyen("NSR:StopPlace:59651")],
    },
  });
  const skipsSkoyen = call({
    aimedDepartureTime: "2026-10-15T09:20:00+02:00",
    expectedDepartureTime: "2026-10-15T09:20:00+02:00",
    destinationDisplay: { frontText: "Spikkestad" },
    serviceJourney: {
      id: "VYG:ServiceJourney:skip",
      line: { id: L1_LINE_ID },
      passingTimes: [skoyen("NSR:StopPlace:706")],
      estimatedCalls: [skoyen("NSR:StopPlace:157")],
    },
  });
  const otherLine = call({
    aimedDepartureTime: "2026-10-15T09:15:00+02:00",
    expectedDepartureTime: "2026-10-15T09:15:00+02:00",
    destinationDisplay: { frontText: "Oslo S" },
    serviceJourney: {
      id: "VYG:ServiceJourney:fly",
      line: { id: "FLT:Line:FLY2" },
      passingTimes: [skoyen(SKOYEN_STOP_PLACE_ID)],
    },
  });

  assert.equal(callsAtSkoyen(viaPassing), true);
  assert.equal(callsAtSkoyen(viaEstimated), true);
  assert.equal(callsAtSkoyen(skipsSkoyen), false);
  assert.deepEqual(
    l1Departures([viaPassing, skipsSkoyen, otherLine, viaEstimated]).map((row) => row.id),
    ["VYG:ServiceJourney:keep@2026-10-15T09:10:00+02:00", "VYG:ServiceJourney:estimated@2026-10-15T09:40:00+02:00"],
  );
});

test("bus 150 from Stabekk stays only when it runs toward Nationaltheatret", () => {
  const toward = call({
    aimedDepartureTime: "2026-10-15T09:07:00+02:00",
    expectedDepartureTime: "2026-10-15T09:07:00+02:00",
    destinationDisplay: { frontText: "Nationaltheatret" },
    serviceJourney: { id: "RUT:ServiceJourney:to-town", line: { id: BUS_150_LINE_ID } },
  });
  const away = call({
    aimedDepartureTime: "2026-10-15T09:12:00+02:00",
    expectedDepartureTime: "2026-10-15T09:12:00+02:00",
    destinationDisplay: { frontText: "Gullhaug" },
    serviceJourney: { id: "RUT:ServiceJourney:away", line: { id: BUS_150_LINE_ID } },
  });
  const other = call({
    aimedDepartureTime: "2026-10-15T09:08:00+02:00",
    expectedDepartureTime: "2026-10-15T09:08:00+02:00",
    destinationDisplay: { frontText: "Nationaltheatret" },
    serviceJourney: { id: "RUT:ServiceJourney:160", line: { id: "RUT:Line:160" } },
  });
  assert.deepEqual(bus150Departures([toward, away, other]).map((row) => row.destination), ["Nationaltheatret"]);
});

test("L2 and R21 keep only journeys that call at Skøyen", () => {
  const l2Keep = call({
    aimedDepartureTime: "2026-10-16T10:00:00+02:00",
    expectedDepartureTime: "2026-10-16T10:00:00+02:00",
    destinationDisplay: { frontText: "Ski" },
    serviceJourney: {
      id: "VYG:ServiceJourney:l2-keep",
      line: { id: L2_LINE_ID },
      passingTimes: [skoyen("NSR:StopPlace:706"), skoyen(SKOYEN_STOP_PLACE_ID)],
    },
  });
  const l2Skip = call({
    aimedDepartureTime: "2026-10-16T10:30:00+02:00",
    expectedDepartureTime: "2026-10-16T10:30:00+02:00",
    destinationDisplay: { frontText: "Ski" },
    serviceJourney: {
      id: "VYG:ServiceJourney:l2-skip",
      line: { id: L2_LINE_ID },
      passingTimes: [skoyen("NSR:StopPlace:706")],
    },
  });
  const r21Keep = call({
    aimedDepartureTime: "2026-10-16T10:36:00+02:00",
    expectedDepartureTime: "2026-10-16T10:36:00+02:00",
    destinationDisplay: { frontText: "Moss" },
    serviceJourney: {
      id: "VYG:ServiceJourney:r21-keep",
      line: { id: R21_LINE_ID },
      estimatedCalls: [skoyen("NSR:StopPlace:59651")],
    },
  });
  const r21Other = call({
    aimedDepartureTime: "2026-10-16T10:40:00+02:00",
    expectedDepartureTime: "2026-10-16T10:40:00+02:00",
    destinationDisplay: { frontText: "Moss" },
    serviceJourney: {
      id: "VYG:ServiceJourney:r21-as-l2",
      line: { id: L2_LINE_ID },
      passingTimes: [skoyen(SKOYEN_STOP_PLACE_ID)],
    },
  });

  assert.deepEqual(l2Departures([l2Keep, l2Skip, r21Keep]).map((row) => row.destination), ["Ski"]);
  assert.deepEqual(r21Departures([r21Keep, r21Other, l2Keep]).map((row) => row.id), [
    "VYG:ServiceJourney:r21-keep@2026-10-16T10:36:00+02:00",
  ]);
});

test("delay is expected minus aimed, and a cancellation is Innstilt", () => {
  assert.equal(delayMinutes("2026-10-15T09:07:00+02:00", "2026-10-15T09:08:10+02:00"), 1);
  assert.equal(delayMinutes("2026-10-15T09:07:00+02:00", "2026-10-15T09:07:00+02:00"), 0);
  assert.equal(delayMinutes("2026-10-15T09:10:00+02:00", "2026-10-15T09:08:00+02:00"), -2);

  const now = new Date("2026-10-15T09:04:00+02:00");
  const delayed = bus150Departures([
    call({
      aimedDepartureTime: "2026-10-15T09:07:00+02:00",
      expectedDepartureTime: "2026-10-15T09:08:10+02:00",
      destinationDisplay: { frontText: "Nationaltheatret" },
      serviceJourney: { id: "bus", line: { id: BUS_150_LINE_ID } },
    }),
  ])[0];
  assert.deepEqual(departureDisplay(delayed, now), {
    time: "09:08",
    delayLabel: "+1 min",
    untilLabel: "om 4 min",
    cancelled: false,
    tone: "delayed",
  });

  const early = { ...delayed, aimed: "2026-10-15T09:10:00+02:00", expected: "2026-10-15T09:08:00+02:00" };
  assert.equal(departureDisplay(early, now).delayLabel, null);
  assert.equal(departureDisplay(early, now).time, "09:08");
  assert.equal(departureDisplay(early, now).tone, "ontime");

  const cancelled = { ...delayed, cancelled: true, aimed: "2026-10-15T09:07:00+02:00", expected: "2026-10-15T09:12:00+02:00" };
  assert.deepEqual(departureDisplay(cancelled, now), {
    time: "09:07",
    delayLabel: "Innstilt",
    untilLabel: null,
    cancelled: true,
    tone: "cancelled",
  });
});

test("countdown comes from expected departure, and a cancellation has none", () => {
  const base = {
    id: "soon",
    line: "L1" as const,
    destination: "Lillestrøm",
    aimed: "2026-10-15T09:10:00+02:00",
    expected: "2026-10-15T09:10:00+02:00",
    cancelled: false,
  };
  const now = new Date("2026-10-15T09:00:00+02:00");
  assert.equal(untilLabel("2026-10-15T09:00:40+02:00", now), "nå");
  assert.equal(untilLabel("2026-10-15T09:00:59+02:00", now), "nå");
  assert.equal(untilLabel("2026-10-15T09:01:00+02:00", now), "om 1 min");
  assert.equal(untilLabel("2026-10-15T09:14:00+02:00", now), "om 14 min");
  assert.equal(untilLabel("not-a-time", now), null);

  assert.equal(departureDisplay({ ...base, expected: "2026-10-15T09:00:40+02:00" }, now).untilLabel, "nå");
  const cancelledSoon = departureDisplay(
    { ...base, cancelled: true, aimed: "2026-10-15T09:00:20+02:00", expected: "2026-10-15T09:00:20+02:00" },
    now,
  );
  assert.equal(cancelledSoon.untilLabel, null);
  assert.equal(cancelledSoon.delayLabel, "Innstilt");
  assert.equal(cancelledSoon.tone, "cancelled");
});

test("each line keeps its own next three departures", () => {
  const now = new Date("2026-10-15T07:40:00.000Z");
  const board = selectDepartureLines(
    [
      { id: "past", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T07:30:00.000Z", expected: "2026-10-15T07:30:00.000Z", cancelled: false },
      { id: "l1-a", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T08:00:00.000Z", expected: "2026-10-15T08:00:00.000Z", cancelled: false },
      { id: "l1-b", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T08:20:00.000Z", expected: "2026-10-15T08:20:00.000Z", cancelled: false },
      { id: "l1-c", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T08:40:00.000Z", expected: "2026-10-15T08:40:00.000Z", cancelled: true },
      { id: "l1-d", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T09:00:00.000Z", expected: "2026-10-15T09:00:00.000Z", cancelled: false },
      { id: "bus-a", line: "150", destination: "Nationaltheatret", aimed: "2026-10-15T07:50:00.000Z", expected: "2026-10-15T07:50:00.000Z", cancelled: false },
      { id: "bus-b", line: "150", destination: "Nationaltheatret", aimed: "2026-10-15T08:05:00.000Z", expected: "2026-10-15T08:05:00.000Z", cancelled: true },
      { id: "bus-a", line: "150", destination: "Nationaltheatret", aimed: "2026-10-15T07:50:00.000Z", expected: "2026-10-15T07:50:00.000Z", cancelled: false },
      { id: "bus-c", line: "150", destination: "Nationaltheatret", aimed: "2026-10-15T08:25:00.000Z", expected: "2026-10-15T08:25:00.000Z", cancelled: false },
    ],
    now,
  );
  assert.deepEqual(
    board.map((line) => [line.line, line.departures.map((row) => row.id)]),
    [
      ["L1", ["l1-a", "l1-b", "l1-c"]],
      ["L2", []],
      ["R21", []],
      ["150", ["bus-a", "bus-b", "bus-c"]],
    ],
  );
  assert.equal(board[1].destination, "Ski");
  assert.equal(board[2].destination, "Moss");
  assert.equal(board[0].departures[2].cancelled, true);

  const frozen = selectDepartureLines(fixtureDepartures.rows, SNAPSHOT_AT);
  assert.deepEqual(frozen.map((line) => line.line), ["L1", "L2", "R21", "150"]);
  assert.deepEqual(frozen[0].departures.map((row) => row.id), ["l1-on", "l1-delay", "l1-cancel"]);
  assert.deepEqual(departureDisplay(frozen[0].departures[0], SNAPSHOT_AT), {
    time: "07:56",
    delayLabel: null,
    untilLabel: "om 14 min",
    cancelled: false,
    tone: "ontime",
  });
  assert.deepEqual(departureDisplay(frozen[0].departures[1], SNAPSHOT_AT), {
    time: "08:16",
    delayLabel: "+2 min",
    untilLabel: "om 34 min",
    cancelled: false,
    tone: "delayed",
  });
  assert.deepEqual(departureDisplay(frozen[0].departures[2], SNAPSHOT_AT), {
    time: "08:40",
    delayLabel: "Innstilt",
    untilLabel: null,
    cancelled: true,
    tone: "cancelled",
  });
  assert.deepEqual(frozen[1].departures.map((row) => row.id), ["l2-on", "l2-delay", "l2-cancel"]);
  assert.equal(frozen[1].destination, "Ski");
  assert.deepEqual(frozen[2].departures.map((row) => row.id), ["r21-on", "r21-delay", "r21-cancel"]);
  assert.equal(frozen[2].destination, "Moss");
  assert.deepEqual(frozen[3].departures.map((row) => row.id), ["bus-delay", "bus-cancel", "bus-on"]);
  assert.deepEqual(departureDisplay(frozen[3].departures[0], SNAPSHOT_AT), {
    time: "07:49",
    delayLabel: "+3 min",
    untilLabel: "om 7 min",
    cancelled: false,
    tone: "delayed",
  });
  assert.equal(departureDisplay(frozen[3].departures[1], SNAPSHOT_AT).delayLabel, "Innstilt");
  assert.equal(departureDisplay(frozen[3].departures[1], SNAPSHOT_AT).untilLabel, null);
  assert.deepEqual(departureDisplay(frozen[3].departures[2], SNAPSHOT_AT), {
    time: "08:22",
    delayLabel: null,
    untilLabel: "om 40 min",
    cancelled: false,
    tone: "ontime",
  });
});

test("an Entur payload is filtered before it is cached", async () => {
  const payload = {
    data: {
      l1: {
        estimatedCalls: [
          {
            aimedDepartureTime: "2026-10-15T09:10:00+02:00",
            expectedDepartureTime: "2026-10-15T09:14:00+02:00",
            cancellation: false,
            destinationDisplay: { frontText: "Lillestrøm" },
            serviceJourney: {
              id: "VYG:ServiceJourney:1",
              line: { id: L1_LINE_ID },
              passingTimes: [skoyen(SKOYEN_STOP_PLACE_ID)],
            },
          },
          {
            aimedDepartureTime: "2026-10-15T09:25:00+02:00",
            expectedDepartureTime: "2026-10-15T09:25:00+02:00",
            cancellation: false,
            destinationDisplay: { frontText: "Asker" },
            serviceJourney: {
              id: "VYG:ServiceJourney:2",
              line: { id: L1_LINE_ID },
              estimatedCalls: [skoyen("NSR:StopPlace:418")],
            },
          },
        ],
      },
      l2: {
        estimatedCalls: [
          {
            aimedDepartureTime: "2026-10-15T09:30:00+02:00",
            expectedDepartureTime: "2026-10-15T09:30:00+02:00",
            cancellation: false,
            destinationDisplay: { frontText: "Ski" },
            serviceJourney: {
              id: "VYG:ServiceJourney:l2",
              line: { id: L2_LINE_ID },
              passingTimes: [skoyen(SKOYEN_STOP_PLACE_ID)],
            },
          },
        ],
      },
      r21: {
        estimatedCalls: [
          {
            aimedDepartureTime: "2026-10-15T09:36:00+02:00",
            expectedDepartureTime: "2026-10-15T09:36:00+02:00",
            cancellation: false,
            destinationDisplay: { frontText: "Moss" },
            serviceJourney: {
              id: "VYG:ServiceJourney:r21-skip",
              line: { id: R21_LINE_ID },
              passingTimes: [skoyen("NSR:StopPlace:418")],
            },
          },
          {
            aimedDepartureTime: "2026-10-15T10:36:00+02:00",
            expectedDepartureTime: "2026-10-15T10:36:00+02:00",
            cancellation: false,
            destinationDisplay: { frontText: "Moss" },
            serviceJourney: {
              id: "VYG:ServiceJourney:r21",
              line: { id: R21_LINE_ID },
              estimatedCalls: [skoyen(SKOYEN_STOP_PLACE_ID)],
            },
          },
        ],
      },
      bus: {
        estimatedCalls: [
          {
            aimedDepartureTime: "2026-10-15T09:12:00+02:00",
            expectedDepartureTime: "2026-10-15T09:12:00+02:00",
            cancellation: true,
            destinationDisplay: { frontText: "Nationaltheatret" },
            serviceJourney: { id: "RUT:ServiceJourney:1", line: { id: BUS_150_LINE_ID } },
          },
        ],
      },
    },
  };
  const view = departuresFromEntur(payload);
  assert.deepEqual(view?.rows.map((row) => row.line), ["L1", "L2", "R21", "150"]);
  assert.equal(view?.rows.find((row) => row.line === "150")?.cancelled, true);
  assert.equal(view?.rows.find((row) => row.line === "R21")?.id, "VYG:ServiceJourney:r21@2026-10-15T10:36:00+02:00");

  let clientName = "";
  const fetched = await getDepartures(async (_url, init) => {
    clientName = new Headers(init?.headers).get("ET-Client-Name") ?? "";
    return Response.json(payload);
  });
  assert.equal(clientName, ENTUR_CLIENT_NAME);
  assert.equal(fetched.rows.length, 4);
  assert.equal(departuresFromEntur({ data: { l1: null, bus: { estimatedCalls: [] } } }), null);
  assert.equal(
    departuresFromEntur({
      data: { l1: { estimatedCalls: [] }, l2: { estimatedCalls: [] }, bus: { estimatedCalls: [] } },
    }),
    null,
  );
});
