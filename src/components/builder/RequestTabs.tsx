import { useRequestStore } from "../../store/requestStore";
import { methodColor } from "../MethodBadge";

/** Pestañas de las peticiones abiertas (estilo navegador) sobre el constructor. */
export function RequestTabs() {
  const { tabs, activeTabId, selectTab, closeTab } = useRequestStore();
  if (tabs.length === 0) return null;

  return (
    <div style={{ height: 36, flex: "none", display: "flex", alignItems: "stretch", background: "var(--bg-tabbar)", borderBottom: "0.5px solid var(--border)", overflowX: "auto" }}>
      {tabs.map((t) => {
        const active = t.id === activeTabId;
        return (
          <div
            key={t.id}
            onClick={() => selectTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 10px 0 12px", borderRight: "0.5px solid var(--border)", cursor: "pointer", background: active ? "var(--bg-app)" : "transparent", maxWidth: 220, flex: "none" }}
          >
            <span className="mono" style={{ fontSize: "var(--text-nano)", fontWeight: 600, color: methodColor(t.method) }}>{t.method}</span>
            <span className="mono" style={{ fontSize: "var(--text-xs)", color: active ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.path}</span>
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              style={{ display: "flex", opacity: 0.6 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="var(--text-muted)" strokeWidth="1.1" strokeLinecap="round" /></svg>
            </span>
          </div>
        );
      })}
    </div>
  );
}
