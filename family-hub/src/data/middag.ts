import type { DinnerMenu, Meal, StagedDrag } from "./types";

const meal = (id: string, title: string, minutes: number): Meal => ({
  id,
  title,
  minutes,
  ingredients: [],
});

export const dinnerMenu: DinnerMenu = {
  startsOn: { year: 2026, month: 9, day: 28 },
  period: "28.09 – 04.10",
  days: [
    { id: "man", weekday: "mandag", date: "28.09", meal: meal("wok", "Kyllingwok med nudler", 30) },
    { id: "tir", weekday: "tirsdag", date: "29.09", meal: meal("laks-pasta", "Laksepasta", 25) },
    { id: "ons", weekday: "onsdag", date: "30.09", meal: meal("kjottkaker", "Kjøttkaker med potetmos", 45) },
    { id: "tor", weekday: "torsdag", date: "01.10", meal: meal("linsesuppe", "Linsesuppe", 35) },
    { id: "fre", weekday: "fredag", date: "02.10", meal: null },
    { id: "lor", weekday: "lørdag", date: "03.10", meal: meal("ovnslaks", "Ovnsbakt laks med poteter", 35) },
    { id: "son", weekday: "søndag", date: "04.10", meal: meal("fiskegrateng", "Fiskegrateng", 40) },
  ],
  aisles: [
    {
      id: "gront",
      label: "Frukt og grønt",
      items: [
        { id: "paprika", name: "Paprika", quantity: "2 stk" },
        { id: "gulrot", name: "Gulrøtter", quantity: "1 pose" },
        { id: "lok", name: "Løk", quantity: "3 stk", done: true },
        { id: "sitron", name: "Sitron", quantity: "2 stk" },
      ],
    },
    {
      id: "kjott",
      label: "Kjøtt og fisk",
      items: [
        { id: "laks", name: "Laksefilet", quantity: "800 g" },
        { id: "kylling", name: "Kyllingfilet", quantity: "600 g" },
        { id: "kjottdeig", name: "Kjøttdeig", quantity: "400 g" },
      ],
    },
    {
      id: "meieri",
      label: "Meieri, laktosefritt",
      items: [
        { id: "melk", name: "Melk", quantity: "1 l" },
        { id: "smor", name: "Smør", quantity: "1 pk", done: true },
        { id: "ost", name: "Revet ost", quantity: "1 pk" },
      ],
    },
    {
      id: "glutenfritt",
      label: "Glutenfritt",
      items: [
        { id: "nudler", name: "Nudler", quantity: "2 pk" },
        { id: "pasta", name: "Pasta", quantity: "1 pk" },
        { id: "skjell", name: "Taco-skjell", quantity: "1 pk" },
        { id: "linser", name: "Linser", quantity: "1 pk" },
      ],
    },
    {
      id: "ukemeny",
      label: "Fra ukemenyen",
      items: [],
    },
  ],
};

export const stagedDrag: StagedDrag = {
  fromDayId: "fre",
  targetDayId: "ons",
  meal: meal("taco", "Taco", 25),
};
