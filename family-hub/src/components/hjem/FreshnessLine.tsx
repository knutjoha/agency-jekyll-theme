import { osloUpdatedLabel, type SectionPhase } from "@/lib/home-cache";

export function FreshnessLine({ phase, updatedAt }: { phase: SectionPhase; updatedAt: string | null }) {
  if (phase === "loading") return null;
  const time = updatedAt ? osloUpdatedLabel(updatedAt) : "";
  const text =
    phase === "updating"
      ? "Oppdaterer…"
      : phase === "offline"
        ? time
          ? `Ingen nett · sist ${time}`
          : "Ingen nett"
        : phase === "error"
          ? time
            ? `Ikke oppdatert · sist ${time}`
            : "Ikke oppdatert"
          : time
            ? `Oppdatert ${time}`
            : "";
  if (!text) return null;
  return (
    <div
      data-freshness={phase}
      data-updated-at={updatedAt ?? ""}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 12,
        lineHeight: 1.2,
        fontWeight: 400,
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}
