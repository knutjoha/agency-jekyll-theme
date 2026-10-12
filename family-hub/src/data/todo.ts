import type { TodoLane, TodoTask } from "./types";
import { dueFields } from "@/lib/frist";
import { SNAPSHOT_AT, osloDateKey } from "@/lib/oslo";

const snapshotDay = osloDateKey(SNAPSHOT_AT);

function task(
  id: string,
  title: string,
  options?: { dueOn?: string; done?: boolean; editing?: boolean },
): TodoTask {
  return {
    id,
    title,
    ...(options?.dueOn ? dueFields(options.dueOn, snapshotDay) : {}),
    ...(options?.done ? { done: true } : {}),
    ...(options?.editing ? { editing: true } : {}),
  };
}

export const todoLanes: TodoLane[] = [
  {
    personId: "knut",
    detail: "Pappa",
    tasks: [
      task("knut-eu", "Bestille EU-kontroll", { dueOn: "2026-10-31" }),
      task("knut-pass", "Fornye pass for Maja", { dueOn: "2026-11-12" }),
      task("knut-dekk", "Sjekke dekk før hyttetur", { dueOn: "2026-10-04" }),
      task("knut-kontingent", "Betale håndball-kontingent", { done: true }),
    ],
  },
  {
    personId: "ulla",
    detail: "Mamma",
    tasks: [
      task("ulla-samtykke", "Svare på leirskole-samtykke", { dueOn: "2026-10-06" }),
      task("ulla-mote", "Melde på foreldremøte 8B", { dueOn: "2026-10-09" }),
      task("ulla-gave", "Kjøpe gave til tvillingene", { dueOn: "2026-10-18" }),
    ],
  },
  {
    personId: "amelia",
    detail: "8A",
    tasks: [
      task("amelia-bag", "Pakke håndballbag", { dueOn: "2026-10-03" }),
      task("amelia-prove", "Lese til naturfagsprøve", { dueOn: "2026-10-06" }),
    ],
  },
  {
    personId: "hedda",
    detail: "8B",
    tasks: [
      task("hedda-norsk", "Levere innlevering i norsk", { dueOn: "2026-10-02" }),
      task("hedda-hytte", "Pakke til hytta", { dueOn: "2026-10-11" }),
    ],
  },
  {
    personId: "maja",
    detail: "6C",
    tasks: [
      task("maja-cheer", "Øve på cheer-rutine", { dueOn: "2026-10-03" }),
      task("maja-rom", "Rydde rommet", { editing: true }),
    ],
  },
];
