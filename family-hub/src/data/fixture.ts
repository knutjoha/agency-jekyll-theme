import type { Dinner, Person, WeatherView } from "./types";

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

export const ATTRIBUTION = "Stabekk · Yr / Meteorologisk institutt og NRK";

export const fixtureWeather: WeatherView = {
  temperature: 4,
  headerSymbol: "cloud-rain",
  summary: "Lett regn før kl. 13 · 2–7° i dag",
  precipLabel: "1,6 mm før kl. 13",
  dayLow: 2,
  dayHigh: 7,
  dayPrecipMm: 1.6,
  attribution: ATTRIBUTION,
  source: "fixture",
  parts: [
    {
      id: "morgen",
      name: "Morgen",
      startHour: 8,
      endHour: 11,
      temperature: 4,
      symbol: "cloud-rain",
      precipitating: true,
      condition: "Regn 1,2 mm",
    },
    {
      id: "formiddag",
      name: "Formiddag",
      startHour: 12,
      endHour: 14,
      temperature: 6,
      symbol: "cloud-drizzle",
      precipitating: true,
      condition: "Yr",
    },
    {
      id: "ettermiddag",
      name: "Ettermiddag",
      startHour: 15,
      endHour: 18,
      temperature: 7,
      symbol: "sun",
      precipitating: false,
      condition: "Sol",
    },
    {
      id: "kveld",
      name: "Kveld",
      startHour: 19,
      endHour: 22,
      temperature: 5,
      symbol: "moon",
      precipitating: false,
      condition: "Klart",
    },
  ],
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
