"use client";

import {
  CalendarDays,
  CookingPot,
  House,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Hjem", icon: House },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/todo", label: "Todo", icon: ListTodo },
  { href: "/middag", label: "Middag", icon: CookingPot },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href;
}

export function NavRail() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = searchParams.get("snapshot") === "1";

  return (
    <nav
      data-region="rail"
      style={{
        width: 96,
        height: "100%",
        flexShrink: 0,
        boxSizing: "border-box",
        background: "var(--tile)",
        padding: "28px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ paddingBottom: 16 }}>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 22,
            lineHeight: 1,
            color: "var(--ink)",
            fontWeight: 400,
          }}
        >
          V
        </div>
      </div>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const href = snapshot ? `${item.href}?snapshot=1` : item.href;
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              padding: "14px 0",
              borderRadius: "var(--r-nested)",
              textDecoration: "none",
              background: active ? "var(--tile-2)" : "transparent",
            }}
          >
            <Icon size={26} color={active ? "var(--accent)" : "var(--text-muted)"} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1,
                fontWeight: 400,
                color: active ? "var(--text)" : "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
