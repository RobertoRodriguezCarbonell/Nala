/** Estado centrado y tenue: vacío, carga o "sin selección". */
export function EmptyState({ text, spinner = false }: { text: string; spinner?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "var(--space-6)",
        padding: "var(--space-7)",
        textAlign: "center",
      }}
    >
      {spinner && (
        <div
          style={{ width: 26, height: 26, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "nala-spin 0.7s linear infinite" }}
        />
      )}
      <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>{text}</span>
    </div>
  );
}
