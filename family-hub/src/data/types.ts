export type PersonId = "amelia" | "hedda" | "maja" | "knut" | "ulla";

export type ColorToken =
  | "--p-amelia"
  | "--p-hedda"
  | "--p-maja"
  | "--p-knut"
  | "--p-ulla"
  | "--accent";

export type CalendarEvent = {
  time: string | null;
  title: string;
};

export type Transport =
  | { kind: "missing"; label: string }
  | { kind: "assigned"; label: string };

export type Person = {
  id: PersonId;
  name: string;
  initial: string;
  detail: string;
  colorToken: ColorToken;
  events: CalendarEvent[];
  transport: Transport;
};

export type Dinner = {
  dish: string;
  diets: string[];
  shoppingCount: number;
};

export type SoonItem = {
  date: string;
  dotToken: ColorToken;
  title: string;
  meta: string;
};

export type WeatherSymbol =
  | "cloud-rain"
  | "cloud-drizzle"
  | "cloud-sun"
  | "cloud"
  | "cloud-moon"
  | "moon";

export type MeteogramSlot = {
  hour: number;
  temperature: number;
  symbol: WeatherSymbol;
  precipitating: boolean;
  barPx: number;
};

export type WeatherView = {
  temperature: number;
  headerSymbol: WeatherSymbol;
  summary: string;
  precipLabel: string;
  slots: MeteogramSlot[];
  attribution: string;
  source: "yr" | "fixture";
};
