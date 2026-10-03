import type { TodoLane } from "./types";

export const todoLanes: TodoLane[] = [
  {
    personId: "knut",
    detail: "Pappa",
    tasks: [
      { id: "knut-eu", title: "Bestille EU-kontroll", due: "31.10 · Tesla Model X" },
      { id: "knut-pass", title: "Fornye pass for Maja", due: "12.11" },
      { id: "knut-dekk", title: "Sjekke dekk før hyttetur", due: "i morgen" },
      { id: "knut-kontingent", title: "Betale håndball-kontingent", done: true },
    ],
  },
  {
    personId: "ulla",
    detail: "Mamma",
    tasks: [
      { id: "ulla-samtykke", title: "Svare på leirskole-samtykke", due: "06.10 · Maja · Jar skole" },
      { id: "ulla-mote", title: "Melde på foreldremøte 8B", due: "09.10" },
      { id: "ulla-gave", title: "Kjøpe gave til tvillingene", due: "18.10" },
    ],
  },
  {
    personId: "amelia",
    detail: "8A",
    tasks: [
      { id: "amelia-bag", title: "Pakke håndballbag", due: "i dag" },
      { id: "amelia-prove", title: "Lese til naturfagsprøve", due: "tirsdag" },
    ],
  },
  {
    personId: "hedda",
    detail: "8B",
    tasks: [
      { id: "hedda-norsk", title: "Levere innlevering i norsk", due: "i går", overdue: true },
      { id: "hedda-hytte", title: "Pakke til hytta", due: "søndag" },
    ],
  },
  {
    personId: "maja",
    detail: "6C",
    tasks: [
      { id: "maja-cheer", title: "Øve på cheer-rutine", due: "i dag" },
      { id: "maja-rom", title: "Rydde rommet", editing: true },
    ],
  },
];
