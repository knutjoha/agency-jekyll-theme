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

export type CalendarBlock =
  | { kind: "routine"; label: string }
  | { kind: "activity"; time: string; title: string; warning?: string };

export type CalendarDay = {
  blocks: CalendarBlock[];
  conflict?: boolean;
};

export type CalendarRow = {
  personId: PersonId;
  detail: string;
  days: CalendarDay[];
};

export type CalendarWeek = {
  startsOn: string;
  notice: string;
  rows: CalendarRow[];
};

export type TodoFilter = "alle" | "frist" | "fullfort";

export type TodoTask = {
  id: string;
  title: string;
  due?: string;
  done?: boolean;
  overdue?: boolean;
  editing?: boolean;
};

export type TodoLane = {
  personId: PersonId;
  detail: string;
  tasks: TodoTask[];
};

export type Meal = {
  id: string;
  title: string;
  diets: string[];
  minutes: number;
  editing?: boolean;
};

export type MenuDay = {
  id: string;
  weekday: string;
  date: string;
  meal: Meal | null;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: string;
  done?: boolean;
};

export type GroceryAisle = {
  id: string;
  label: string;
  items: GroceryItem[];
};

export type DinnerMenu = {
  startsOn: { year: number; month: number; day: number };
  period: string;
  days: MenuDay[];
  aisles: GroceryAisle[];
};

export type StagedDrag = {
  fromDayId: string;
  targetDayId: string;
  meal: Meal;
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
