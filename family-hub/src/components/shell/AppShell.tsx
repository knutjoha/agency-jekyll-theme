import { Suspense, type ReactNode } from "react";
import { NavRail } from "@/components/shell/NavRail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Suspense
        fallback={
          <div
            data-region="rail"
            style={{ width: 96, height: "100%", flexShrink: 0, background: "var(--tile)" }}
          />
        }
      >
        <NavRail />
      </Suspense>
      <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden" }}>{children}</div>
    </div>
  );
}
