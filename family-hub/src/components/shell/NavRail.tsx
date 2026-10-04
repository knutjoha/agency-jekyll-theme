"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isNavActive, navHref, navItems } from "@/components/shell/navItems";

export function NavRail() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = searchParams.get("snapshot") === "1";

  return (
    <nav
      className="nav-rail"
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
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        const href = navHref(item.href, snapshot);
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
