import type { MenuDay } from "@/data/types";

export async function writeJson(path: string, method: "POST" | "PATCH", body: unknown): Promise<boolean> {
  try {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { persisted?: boolean };
    return payload.persisted !== false;
  } catch {
    return false;
  }
}

export function dinnerBody(days: MenuDay[]) {
  return {
    days: days.map((day) => ({
      id: day.id,
      meal: day.meal
        ? {
            id: day.meal.id,
            title: day.meal.title,
            minutes: day.meal.minutes,
            diets: day.meal.diets,
          }
        : null,
    })),
  };
}
