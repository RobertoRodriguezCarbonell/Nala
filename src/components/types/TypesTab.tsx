import { useEffect, useState } from "react";
import { generateTypes, exportTypes, generateClient, exportClient } from "../../lib/tauri";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";

/**
 * Pestaña "Tipos TS": genera las interfaces de los modelos o un cliente TS
 * completo (segmento Tipos · Cliente) y permite copiarlos o guardarlos a un .ts.
 */
export function TypesTab({ serviceId }: { serviceId: number }) {
  const [mode, setMode] = useState<"types" | "client">("types");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setCode(null);
    const gen = mode === "client" ? generateClient(serviceId) : generateTypes(serviceId);
    gen
      .then((ts) => {
        if (alive) {
          setCode(ts);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(String(e));
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [serviceId, mode]);

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* portapapeles no disponible */
    }
  };

  const onSave = async () => {
    try {
      if (mode === "client") await exportClient(serviceId);
      else await exportTypes(serviceId);
    } catch {
      /* exportación cancelada o no disponible */
    }
  };

  const seg = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    padding: "4px 11px",
    borderRadius: 4,
    cursor: "pointer",
    background: active ? "var(--bg-raised)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-faint)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ height: 36, flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "0 13px", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", background: "var(--bg-input)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: 2 }}>
          <div style={seg(mode === "types")} onClick={() => setMode("types")}>Tipos</div>
          <div style={seg(mode === "client")} onClick={() => setMode("client")}>Cliente</div>
        </div>
        {code && <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{code.split("\n").length} líneas</span>}
        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={() => void onCopy()} style={copied ? { color: "var(--status-2xx)" } : undefined}>{copied ? "Copiado ✓" : "Copiar"}</Button>
        <Button variant="secondary" onClick={() => void onSave()}>Guardar…</Button>
      </div>

      {loading ? (
        <EmptyState text={mode === "client" ? "generando cliente…" : "generando tipos…"} />
      ) : error ? (
        <EmptyState text={error.includes("snapshot") || error.includes("no encontrado") ? "Importa el servicio primero para generar el código." : error} />
      ) : !code ? (
        <EmptyState text="Sin código que mostrar." />
      ) : (
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <div className="mono" style={{ fontSize: "var(--text-sm)", lineHeight: "19px", padding: "8px 0" }}>
            {code.split("\n").map((line, i) => (
              <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
                <div style={{ width: 42, flex: "none", textAlign: "right", paddingRight: 12, color: "var(--text-linenum)", userSelect: "none" }}>{i + 1}</div>
                <div style={{ flex: 1, color: "var(--text-secondary)", userSelect: "text", cursor: "text" }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
