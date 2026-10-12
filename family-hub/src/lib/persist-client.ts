import type { GroceryAisle, MenuDay } from "@/data/types";

export type SavedDinner = {
  persisted: boolean;
  week?: string;
  days?: MenuDay[];
  aisles?: GroceryAisle[];
};

export async function writeJson(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body: unknown,
): Promise<boolean> {
  const saved = await writeJsonResult(path, method, body);
  return saved?.persisted === true;
}

export async function writeJsonResult(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body: unknown,
): Promise<SavedDinner | null> {
  try {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as SavedDinner;
    if (!response.ok || payload.persisted === false) return { persisted: false };
    return payload;
  } catch {
    return null;
  }
}

export function dinnerBody(week: string, days: MenuDay[]) {
  return {
    week,
    days: days.map((day) => ({
      id: day.id,
      meal: day.meal
        ? {
            id: day.meal.id,
            title: day.meal.title,
            minutes: day.meal.minutes,
          }
        : null,
    })),
  };
}
