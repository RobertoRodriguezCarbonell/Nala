import { useState } from "react";

export interface TabItem {
  key: string;
  label: string;
  badge?: number;
  help?: string;
}

/** Barra de pestañas con subrayado de acento. Genérica (servicio / constructor). */
export function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabItem[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{ flex: "none", display: "flex", alignItems: "stretch", height: 34, padding: "0 12px", gap: "var(--space-1)", borderBottom: "0.5px solid var(--border-subtle)", overflowX: "auto", overflowY: "hidden" }}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <div
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", whiteSpace: "nowrap", cursor: "pointer", color: isActive ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}` }}
          >
            {t.label}
            {t.badge != null && (
              <span className="mono" style={{ fontSize: "var(--text-nano)", color: "var(--bg-app)", background: "var(--accent)", borderRadius: 8, padding: "0 5px", fontWeight: 600 }}>{t.badge}</span>
            )}
            {t.help && <HelpTip text={t.help} />}
          </div>
        );
      })}
    </div>
  );
}

/** Icono «?» con tooltip propio que explica para qué sirve la pestaña. */
function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Qué hace esta pestaña"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, borderRadius: "50%", border: "0.5px solid var(--border-control)", fontSize: "var(--text-nano)", lineHeight: 1, color: open ? "var(--text-primary)" : "var(--text-disabled)", cursor: "help", userSelect: "none" }}
      >
        ?
      </span>
      {open && (
        <div
          role="tooltip"
          style={{ position: "absolute", top: "calc(100% + 7px)", left: 0, zIndex: 50, width: 250, padding: "9px 11px", background: "var(--bg-input)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)", fontSize: "var(--text-xs)", lineHeight: "16px", fontWeight: 400, color: "var(--text-secondary)", whiteSpace: "normal", pointerEvents: "none" }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
