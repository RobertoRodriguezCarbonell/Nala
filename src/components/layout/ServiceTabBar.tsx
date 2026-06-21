import { useUiStore } from "../../store/uiStore";

const TABS: { key: "endpoints" | "diff" | "types" | "history"; label: string }[] = [
  { key: "endpoints", label: "Endpoints" },
  { key: "diff", label: "Diff de esquema" },
  { key: "types", label: "Tipos TS" },
  { key: "history", label: "Historial" },
];

export function ServiceTabBar() {
  const serviceView = useUiStore((s) => s.serviceView);
  const setServiceView = useUiStore((s) => s.setServiceView);

  return (
    <div style={{ flex: "none", display: "flex", alignItems: "stretch", height: 34, padding: "0 12px", gap: 4, borderBottom: "0.5px solid var(--border-subtle)" }}>
      {TABS.map((t) => (
        <div
          key={t.key}
          onClick={() => setServiceView(t.key)}
          style={{ display: "flex", alignItems: "center", padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer", color: serviceView === t.key ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${serviceView === t.key ? "var(--accent)" : "transparent"}` }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
