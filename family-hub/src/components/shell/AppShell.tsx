import { Suspense, type ReactNode } from "react";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { NavOrbsOverlay, NavOrbsRoot } from "@/components/shell/NavOrbs";
import { NavRail } from "@/components/shell/NavRail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <NavOrbsRoot>
      <div className="shell">
        <Suspense
          fallback={
            <div
              className="nav-rail"
              data-region="rail"
              style={{ width: 96, height: "100%", flexShrink: 0, background: "var(--tile)" }}
            />
          }
        >
          <NavRail />
        </Suspense>
        <div className="shell-main">
          {children}
          <NavOrbsOverlay />
        </div>
        <Suspense fallback={<div className="tab-bar" data-region="tab-bar" />}>
          <MobileTabBar />
        </Suspense>
      </div>
    </NavOrbsRoot>
  );
}
