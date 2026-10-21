import type { GroceryAisle, GroceryItem } from "../../data/types";

export type DoneShoppingItem = {
  aisleId: string;
  index: number;
  item: GroceryItem;
};

export function collectDone(aisles: GroceryAisle[]): DoneShoppingItem[] {
  const done: DoneShoppingItem[] = [];
  for (const aisle of aisles) {
    aisle.items.forEach((item, index) => {
      if (!item.done) return;
      done.push({ aisleId: aisle.id, index, item: { ...item } });
    });
  }
  return done;
}

export function withoutDone(aisles: GroceryAisle[]): GroceryAisle[] {
  return aisles.map((aisle) => ({
    ...aisle,
    items: aisle.items.filter((item) => !item.done),
  }));
}

export function insertItem(aisles: GroceryAisle[], entry: DoneShoppingItem): GroceryAisle[] {
  return aisles.map((aisle) => {
    if (aisle.id !== entry.aisleId) return aisle;
    if (aisle.items.some((item) => item.id === entry.item.id)) return aisle;
    const items = aisle.items.slice();
    items.splice(Math.min(Math.max(entry.index, 0), items.length), 0, entry.item);
    return { ...aisle, items };
  });
}
