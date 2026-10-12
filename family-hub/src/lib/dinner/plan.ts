import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { GroceryAisle, MenuDay } from "@/data/types";
import { mondayOf, parseIsoDate } from "@/lib/calendar-view";
import { DAY_IDS } from "@/lib/household/map";
import { loadDinner, loadShopping, saveDinnerDay, type DinnerLoad } from "@/lib/household/store";
import {
  assignPlanIds,
  dayWriteSet,
  dinnerPrompt,
  parseModelJson,
  proposalsFromModel,
  targetMonday,
  weekWriteSet,
  type PlannedMeal,
} from "./week";

export type DinnerPlanBody = {
  persisted: boolean;
  week?: string;
  startsOn?: DinnerLoad["startsOn"];
  period?: string;
  days?: MenuDay[];
  aisles?: GroceryAisle[];
};

export type PlanRequest =
  | { scope: "week"; now?: Date; snapshot?: boolean }
  | { scope: "day"; week: string; dayId: string; snapshot?: boolean };

type PlanOutcome = { status: number; body: DinnerPlanBody };

const ANTHROPIC_MODEL = "claude-sonnet-5-5";
const XAI_MODEL = "grok-4.7";

function fail(status: number): PlanOutcome {
  return { status, body: { persisted: false } };
}

function succeed(dinner: DinnerLoad, aisles: GroceryAisle[]): PlanOutcome {
  return {
    status: 200,
    body: {
      persisted: true,
      week: dinner.week,
      startsOn: dinner.startsOn,
      period: dinner.period,
      days: dinner.days,
      aisles,
    },
  };
}

function modelName(fallback: string): string {
  const chosen = process.env.DINNER_MODEL?.trim();
  return chosen ? chosen : fallback;
}

function provider(): "xai" | "anthropic" {
  return process.env.DINNER_PLANNER?.trim() === "xai" ? "xai" : "anthropic";
}

function textFromBlocks(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const text = value
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const record = block as { type?: unknown; text?: unknown };
      if (record.type !== "text" || typeof record.text !== "string") return "";
      return record.text;
    })
    .join("");
  const trimmed = text.trim();
  return trimmed ? text : null;
}

async function complete(prompt: string): Promise<string> {
  if (provider() === "xai") return completeXai(prompt);
  return completeAnthropic(prompt);
}

async function completeAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  if (!key) throw new Error("model failed");
  const model = modelName(ANTHROPIC_MODEL);
  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  };
  if (model === ANTHROPIC_MODEL) {
    body.thinking = { type: "between_tools" };
    body.output_config = { effort: "medium" };
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(50_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`[family-hub] dinner plan model failed: ${response.status}`);
    throw new Error("model failed");
  }
  const payload: unknown = await response.json();
  const content = payload && typeof payload === "object" ? (payload as { content?: unknown }).content : null;
  const text = textFromBlocks(content);
  if (!text) throw new Error("model failed");
  return text;
}

async function completeXai(prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY?.trim() ?? "";
  if (!key) throw new Error("model failed");
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelName(XAI_MODEL),
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(50_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`[family-hub] dinner plan model failed: ${response.status}`);
    throw new Error("model failed");
  }
  const payload: unknown = await response.json();
  const content =
    payload && typeof payload === "object"
      ? (payload as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content
      : null;
  if (typeof content === "string" && content.trim()) return content;
  const blocks = textFromBlocks(content);
  if (!blocks) throw new Error("model failed");
  return blocks;
}

async function readHousehold(): Promise<string | null> {
  try {
    return await readFile(path.join(process.cwd(), "content", "dinner.md"), "utf8");
  } catch {
    console.error("[family-hub] dinner plan failed: context file missing");
    return null;
  }
}

export async function planDinner(request: PlanRequest): Promise<PlanOutcome> {
  const snapshot = request.snapshot === true;
  let monday: string;
  if (request.scope === "day") {
    if (!parseIsoDate(request.week) || !DAY_IDS.includes(request.dayId as (typeof DAY_IDS)[number])) return fail(400);
    monday = mondayOf(request.week);
  } else {
    monday = targetMonday(request.now ?? new Date());
  }

  const dinner = await loadDinner({ snapshot, week: monday });
  if (!dinner.persisted || dinner.week !== monday) return fail(400);

  if (request.scope === "week" && dinner.days.every((day) => day.meal)) {
    const shopping = await loadShopping({ snapshot, week: monday });
    if (!shopping.persisted || shopping.week !== monday) return fail(400);
    return succeed(dinner, shopping.aisles);
  }

  const household = await readHousehold();
  if (household === null) return fail(502);

  const prompt = dinnerPrompt({
    household,
    monday,
    days: dinner.days,
    scope: request.scope === "week" ? { kind: "week" } : { kind: "day", dayId: request.dayId },
  });

  let parsed: unknown;
  try {
    parsed = parseModelJson(await complete(prompt));
  } catch {
    return fail(502);
  }
  if (parsed === null) return fail(502);

  let proposals: PlannedMeal[] = proposalsFromModel(parsed);
  proposals = request.scope === "week" ? weekWriteSet(dinner.days, proposals) : dayWriteSet(request.dayId, proposals);
  if (proposals.length === 0) return fail(502);

  const fresh = await loadDinner({ week: monday });
  if (!fresh.persisted || fresh.week !== monday) return fail(502);
  if (request.scope === "week") {
    proposals = weekWriteSet(fresh.days, proposals);
    if (proposals.length === 0) return fail(502);
  }

  const used = fresh.days.flatMap((day) => (day.meal ? [day.meal.id] : []));
  for (const day of assignPlanIds(proposals, used)) {
    const saved = await saveDinnerDay({
      week: monday,
      dayId: day.dayId,
      meal: day.meal,
      ingredients: day.ingredients,
    });
    if (!saved.persisted) return fail(502);
  }

  const [reloaded, shopping] = await Promise.all([loadDinner({ week: monday }), loadShopping({ week: monday })]);
  if (!reloaded.persisted || reloaded.week !== monday || !shopping.persisted || shopping.week !== monday) return fail(502);
  return succeed(reloaded, shopping.aisles);
}
