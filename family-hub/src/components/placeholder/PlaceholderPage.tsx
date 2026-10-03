export function PlaceholderPage({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 42,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {title}
      </div>
      <p
        style={{
          margin: "12px 0 0",
          fontFamily: "var(--font-body)",
          fontSize: 20,
          lineHeight: 1.4,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {message}
      </p>
    </div>
  );
}
