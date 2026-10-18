const pill = {
  flexShrink: 0,
  padding: "8px 14px",
  border: "none",
  borderRadius: "var(--r-full)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: "normal",
  fontWeight: 400,
  whiteSpace: "nowrap" as const,
};

export function ClearDoneButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-todo-action="clear-done"
      className="pill-ghost"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...pill,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      Fjern fullførte
    </button>
  );
}
