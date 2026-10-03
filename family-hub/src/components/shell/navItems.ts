import {
  CalendarDays,
  CookingPot,
  House,
  ListTodo,
  type LucideIcon,
} from "lucide-react";

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Hjem", icon: House },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/todo", label: "Todo", icon: ListTodo },
  { href: "/middag", label: "Middag", icon: CookingPot },
];

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href;
}

export function navHref(href: string, snapshot: boolean): string {
  if (!snapshot) return href;
  return `${href}?snapshot=1`;
}
