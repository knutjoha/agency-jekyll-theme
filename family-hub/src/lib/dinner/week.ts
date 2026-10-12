import { timingSafeEqual } from "node:crypto";
import { addIsoDays, mondayOf } from "../calendar-view";
import { DAY_IDS, dinnerPeriod } from "../household/map";
import { isoWeekNumber, osloDateKey } from "../oslo";

export type DayId = (typeof DAY_IDS)[number];

export type PlannedIngredient = {
  name: string;
  amount: string;
};

export type PlannedMeal = {
  id: DayId;
  title: string;
  minutes: number;
  ingredients: PlannedIngredient[];
};

export type AssignedDay = {
  dayId: DayId;
  meal: { id: string; title: string; minutes: number };
  ingredients: { id: string; name: string; amount: string }[];
};

export type PromptDay = {
  id: string;
  weekday: string;
  date: string;
  meal: { title: string; minutes: number; ingredients: { name: string; amount: string }[] } | null;
};

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayId(value: string): value is DayId {
  return DAY_IDS.includes(value as DayId);
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max || text.includes("\u0000")) return null;
  return text;
}

export function isOsloSunday(now: Date): boolean {
  const today = osloDateKey(now);
  return addIsoDays(mondayOf(today), 6) === today;
}

/** Monday the week planner should fill. Sunday targets the coming week. */
export function targetMonday(now: Date): string {
  const today = osloDateKey(now);
  const monday = mondayOf(today);
  return isOsloSunday(now) ? addIsoDays(monday, 7) : monday;
}

export function targetWeek(monday: string): { monday: string; sunday: string; period: string; isoWeek: number } {
  const [year, month, day] = monday.split("-").map(Number);
  return {
    monday,
    sunday: addIsoDays(monday, 6),
    period: dinnerPeriod(monday),
    isoWeek: isoWeekNumber(year, month, day),
  };
}

function proposalFrom(entry: unknown): PlannedMeal | null {
  if (!isRecord(entry) || typeof entry.id !== "string" || !isDayId(entry.id)) return null;
  const title = cleanText(entry.title, 200);
  const minutes = entry.minutes;
  if (!title || typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) return null;
  if (!Array.isArray(entry.ingredients) || entry.ingredients.length === 0) return null;
  const ingredients: PlannedIngredient[] = [];
  for (const raw of entry.ingredients) {
    if (!isRecord(raw)) return null;
    const name = cleanText(raw.name, 200);
    const amount = cleanText(raw.amount, 40);
    if (!name || !amount) return null;
    ingredients.push({ name, amount });
  }
  return { id: entry.id, title, minutes, ingredients };
}

/** Keeps dinners that pass the modal limits. A diets field is ignored. */
export function proposalsFromModel(value: unknown): PlannedMeal[] {
  if (!isRecord(value) || !Array.isArray(value.days)) return [];
  const kept: PlannedMeal[] = [];
  const seen = new Set<string>();
  for (const entry of value.days) {
    const meal = proposalFrom(entry);
    if (!meal || seen.has(meal.id)) continue;
    seen.add(meal.id);
    kept.push(meal);
  }
  return kept;
}

export function weekWriteSet<T extends { id: string }>(days: { id: string; meal: unknown }[], proposals: T[]): T[] {
  const filled = new Set(days.filter((day) => day.meal != null).map((day) => day.id));
  return proposals.filter((proposal) => !filled.has(proposal.id));
}

export function dayWriteSet<T extends { id: string }>(dayId: string, proposals: T[]): T[] {
  return proposals.filter((proposal) => proposal.id === dayId);
}

function takeId(base: string, used: Set<string>): string {
  const root = ID_PATTERN.test(base) ? base : "meal";
  let candidate = root;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
    if (n > 1000) break;
  }
  if (!ID_PATTERN.test(candidate) || used.has(candidate)) candidate = `m${used.size + 1}`;
  used.add(candidate);
  return candidate;
}

export function assignPlanIds(meals: PlannedMeal[], usedMealIds: Iterable<string>): AssignedDay[] {
  const used = new Set(usedMealIds);
  return DAY_IDS.flatMap((id) => {
    const meal = meals.find((item) => item.id === id);
    if (!meal) return [];
    const ingredientIds = new Set<string>();
    return [
      {
        dayId: meal.id,
        meal: { id: takeId(`m-${meal.id}`, used), title: meal.title, minutes: meal.minutes },
        ingredients: meal.ingredients.map((item, index) => ({
          id: takeId(`i-${index + 1}`, ingredientIds),
          name: item.name,
          amount: item.amount,
        })),
      },
    ];
  });
}

export function parseModelJson(text: string): unknown | null {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const source = (fenced?.[1] ?? trimmed).trim();
  const direct = readJson(source);
  if (direct !== undefined) return direct;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const sliced = readJson(source.slice(start, end + 1));
  return sliced === undefined ? null : sliced;
}

function readJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export function dinnerPrompt(input: {
  household: string;
  monday: string;
  days: PromptDay[];
  scope: { kind: "week" } | { kind: "day"; dayId: string };
}): string {
  const week = targetWeek(input.monday);
  const lines = input.days.map((day) => {
    if (!day.meal) return `- ${day.id} ${day.weekday} ${day.date}: tom`;
    const ingredients = day.meal.ingredients.map((item) => `${item.name} ${item.amount}`).join(", ");
    const ingredientText = ingredients ? ` Ingredienser: ${ingredients}.` : "";
    return `- ${day.id} ${day.weekday} ${day.date}: ${day.meal.title}, ${day.meal.minutes} min.${ingredientText}`;
  });
  const scope =
    input.scope.kind === "week"
      ? "Ukesomfang: returner middager bare for dager som er tomme i listen over. En dag som allerede har en middag er kontekst."
      : `Dagsomfang: bytt dagen ${input.scope.dayId}. De andre seks middagene skal bli som de er lagret. Den nye tittelen skal være en annen enn tittelen på den dagen.`;
  const file = input.household.endsWith("\n") ? input.household : `${input.household}\n`;
  return [
    file,
    "Måluke",
    `Mandag: ${week.monday}`,
    `Søndag: ${week.sunday}`,
    `ISO-uke: ${week.isoWeek}`,
    `Periode: ${week.period}`,
    "",
    "Dager i denne uken",
    ...lines,
    "",
    "Svar med ett JSON-objekt og ingenting annet. Returner bare middager. Kalenderhendelser og en egen handleliste er utenfor JSON-objektet.",
    scope,
    'Format: {"days":[{"id":"man","title":"Taco","minutes":30,"ingredients":[{"name":"Kjøttdeig","amount":"400 g"}]}]}',
    "",
  ].join("\n");
}

export function bearerMatches(header: string | null, secret: string | undefined): boolean {
  const expected = secret?.trim() ?? "";
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
