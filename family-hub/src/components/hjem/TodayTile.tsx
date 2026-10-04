import type { CalendarSource, Person } from "@/data/types";
import { PersonRow } from "@/components/hjem/PersonRow";

export function TodayTile({
  people,
  numericDate,
  source,
}: {
  people: Person[];
  numericDate: string;
  source: CalendarSource;
}) {
  return (
    <section
      data-region="today"
      data-calendar-source={source}
      style={{
        width: "100%",
        height: 600,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 28,
        borderRadius: "var(--r-tile)",
        background: "var(--tile)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          I dag
        </div>
        <div
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 15,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {numericDate}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {people.map((person) => (
          <PersonRow key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
}
