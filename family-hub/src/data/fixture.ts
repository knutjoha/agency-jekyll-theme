import type { Dinner, Person, SoonItem, WeatherView } from "./types";

export const people: Person[] = [
  {
    id: "amelia",
    name: "Amelia",
    initial: "A",
    detail: "8A · Ringstabekk",
    colorToken: "--p-amelia",
    events: [],
  },
  {
    id: "hedda",
    name: "Hedda",
    initial: "H",
    detail: "8B · Ringstabekk",
    colorToken: "--p-hedda",
    events: [],
  },
  {
    id: "maja",
    name: "Maja",
    initial: "M",
    detail: "6C · Jar skole",
    colorToken: "--p-maja",
    events: [],
  },
  {
    id: "knut",
    name: "Knut",
    initial: "K",
    detail: "Pappa",
    colorToken: "--p-knut",
    events: [],
  },
  {
    id: "ulla",
    name: "Ulla Marie",
    initial: "U",
    detail: "Mamma",
    colorToken: "--p-ulla",
    events: [],
  },
];

export const dinner: Dinner = {
  dish: "Ovnsbakt laks med poteter",
  shoppingCount: 6,
};

export const soon: SoonItem[] = [
  {
    date: "05.10",
    dotToken: "--p-knut",
    title: "Høstferie starter",
    meta: "Begge skoler · om 2 dager",
  },
  {
    date: "06.10",
    dotToken: "--p-ulla",
    title: "Samtykke leirskole",
    meta: "Maja · Jar skole · svar innen 3 dager",
  },
  {
    date: "09.10",
    dotToken: "--p-ulla",
    title: "Foreldremøte 8B",
    meta: "Hedda · påmelding mangler",
  },
  {
    date: "18.10",
    dotToken: "--p-maja",
    title: "Amelia og Hedda fyller 14",
    meta: "om 15 dager · gave ikke kjøpt",
  },
  {
    date: "31.10",
    dotToken: "--accent",
    title: "EU-kontroll Tesla Model X",
    meta: "Pappa · om 28 dager",
  },
  {
    date: "12.11",
    dotToken: "--accent",
    title: "Pass utløper",
    meta: "Maja · Pappa · om 40 dager",
  },
];

export const ATTRIBUTION = "Stabekk · Yr / Meteorologisk institutt og NRK";

export const fixtureWeather: WeatherView = {
  temperature: 4,
  headerSymbol: "cloud-rain",
  summary: "Lett regn før kl. 13 · 2–7° i dag",
  precipLabel: "1,6 mm før kl. 13",
  attribution: ATTRIBUTION,
  source: "fixture",
  slots: [
    { hour: 8, temperature: 3, symbol: "cloud-rain", precipitating: true, barPx: 8 },
    { hour: 10, temperature: 4, symbol: "cloud-rain", precipitating: true, barPx: 24 },
    { hour: 12, temperature: 5, symbol: "cloud-drizzle", precipitating: true, barPx: 11 },
    { hour: 14, temperature: 6, symbol: "cloud-sun", precipitating: false, barPx: 0 },
    { hour: 16, temperature: 7, symbol: "cloud-sun", precipitating: false, barPx: 0 },
    { hour: 18, temperature: 6, symbol: "cloud", precipitating: false, barPx: 0 },
    { hour: 20, temperature: 5, symbol: "cloud-moon", precipitating: false, barPx: 0 },
    { hour: 22, temperature: 4, symbol: "moon", precipitating: false, barPx: 0 },
  ],
};
