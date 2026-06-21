import { useState } from "react";
import { useUiStore } from "../../store/uiStore";

type TabKey = "endpoints" | "diff" | "types" | "history";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  {
    key: "endpoints",
    label: "Endpoints",
    desc: "Explora los endpoints del servicio (importados de su OpenAPI) y lánzalos desde el constructor de peticiones.",
  },
  {
    key: "diff",
    label: "Diff de esquema",
    desc: "Compara dos snapshots del esquema y resalta los cambios entre ellos (endpoints, params, body y respuesta), marcando cuáles son breaking.",
  },
  {
    key: "types",
    label: "Tipos TS",
    desc: "Genera las interfaces TypeScript de los modelos del servicio desde su esquema; puedes copiarlas o guardarlas a un archivo.",
  },
  {
    key: "history",
    label: "Historial",
    desc: "Registro de las peticiones lanzadas (estado, tiempo y tamaño), con la auth redactada y opción de reenviar.",
  },
];

export function ServiceTabBar() {
  const serviceView = useUiStore((s) => s.serviceView);
  const setServiceView = useUiStore((s) => s.setServiceView);

  return (
    <div style={{ flex: "none", display: "flex", alignItems: "stretch", height: 34, padding: "0 12px", gap: 4, borderBottom: "0.5px solid var(--border-subtle)" }}>
      {TABS.map((t) => {
        const active = serviceView === t.key;
        return (
          <div
            key={t.key}
            onClick={() => setServiceView(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer", color: active ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}` }}
          >
            {t.label}
            <HelpTip text={t.desc} />
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 13,
          height: 13,
          borderRadius: "50%",
          border: "0.5px solid var(--border-control)",
          fontSize: 9,
          lineHeight: 1,
          color: open ? "var(--text-primary)" : "var(--text-disabled)",
          cursor: "help",
          userSelect: "none",
        }}
      >
        ?
      </span>
      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 7px)",
            left: 0,
            zIndex: 50,
            width: 250,
            padding: "9px 11px",
            background: "var(--bg-input)",
            border: "0.5px solid var(--border-control)",
            borderRadius: "var(--radius-control)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
            fontSize: 11.5,
            lineHeight: "16px",
            fontWeight: 400,
            color: "var(--text-secondary)",
            whiteSpace: "normal",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
