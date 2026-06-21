import { useEffect, useState } from "react";
import { generateTypes, exportTypes } from "../../lib/tauri";

/**
 * Pestaña "Tipos TS": genera las interfaces TypeScript de los modelos del
 * servicio (vía el motor de Rust) y permite copiarlas o guardarlas a un .ts.
 */
export function TypesTab({ serviceId }: { serviceId: number }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setCode(null);
    generateTypes(serviceId)
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
  }, [serviceId]);

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
    // El diálogo de guardado y la escritura ocurren en Rust (export_types):
    // ninguna ruta cruza el puente IPC.
    try {
      await exportTypes(serviceId);
    } catch {
      /* exportación cancelada o no disponible */
    }
  };

  if (loading) return <Centered text="generando tipos…" />;
  if (error) {
    const noSnapshot = error.includes("snapshot") || error.includes("no encontrado");
    return <Centered text={noSnapshot ? "Importa el servicio primero para generar sus tipos." : error} />;
  }
  if (!code) return <Centered text="Sin tipos que mostrar." />;

  const lines = code.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ height: 36, flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "0 13px", borderBottom: "0.5px solid var(--border)" }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{lines.length} líneas</span>
        <div style={{ flex: 1 }} />
        <ToolBtn label={copied ? "Copiado ✓" : "Copiar"} color={copied ? "var(--status-2xx)" : undefined} onClick={() => void onCopy()} />
        <ToolBtn label="Guardar…" onClick={() => void onSave()} />
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <div className="mono" style={{ fontSize: 12, lineHeight: "19px", padding: "8px 0" }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
              <div style={{ width: 42, flex: "none", textAlign: "right", paddingRight: 12, color: "var(--text-linenum)", userSelect: "none" }}>{i + 1}</div>
              <div style={{ flex: 1, color: "var(--text-secondary)", userSelect: "text", cursor: "text" }}>{line}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ label, color, onClick }: { label: string; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 10px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "var(--bg-input)", color: color ?? "var(--text-secondary)", cursor: "pointer" }}
    >
      {label}
    </button>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 24, textAlign: "center" }}>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>{text}</span>
    </div>
  );
}
