"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isNavActive, navHref, navItems } from "@/components/shell/navItems";

export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = searchParams.get("snapshot") === "1";

  return (
    <nav className="tab-bar" data-region="tab-bar" aria-label="Hovedmeny">
      <div className="tab-bar-rule" />
      <div className="tab-bar-items">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={navHref(item.href, snapshot)}
              aria-current={active ? "page" : undefined}
              className="tab-bar-item"
            >
              <Icon size={23} color={active ? "var(--accent)" : "var(--text-muted)"} />
              <span style={{ color: active ? "var(--text)" : "var(--text-muted)" }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
