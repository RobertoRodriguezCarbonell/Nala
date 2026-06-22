import { useState } from "react";
import { useSavedRequestsStore } from "../../store/savedRequestsStore";
import { draftFromTab, SMOKE_STATUS_OPTIONS } from "../../lib/request";
import type { OpenTab, TabState } from "../../store/requestStore";

/** Diálogo para guardar la petición del tab activo (opcionalmente como smoke). */
export function SaveRequestDialog({
  tab,
  st,
  operationId,
  onClose,
}: {
  tab: OpenTab;
  st: TabState;
  operationId?: string;
  onClose: () => void;
}) {
  const createSaved = useSavedRequestsStore((s) => s.create);
  const [name, setName] = useState(`${tab.method} ${tab.path}`);
  const [isSmoke, setIsSmoke] = useState(true);
  const [expected, setExpected] = useState("2xx");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await createSaved({
        serviceId: tab.serviceId,
        name: name.trim() || `${tab.method} ${tab.path}`,
        method: tab.method,
        path: tab.path,
        operationId: operationId ?? null,
        draftJson: JSON.stringify(draftFromTab(st)),
        isSmoke,
        expectedStatus: expected,
      });
      onClose();
    } catch (e) {
      setSaving(false);
      setError(typeof e === "string" ? e : "No se pudo guardar la petición.");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380, background: "var(--bg-raised)", border: "0.5px solid var(--border)", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Guardar petición</span>

        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mono"
            style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "7px 10px", fontSize: 12, color: "var(--text-secondary)", outline: "none" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={isSmoke} onChange={(e) => setIsSmoke(e.target.checked)} />
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Marcar como smoke</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, opacity: isSmoke ? 1 : 0.5 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>Status esperado</span>
          <select
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            disabled={!isSmoke}
            className="mono"
            style={{ fontSize: 11.5, background: "var(--bg-input)", color: "var(--text-secondary)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: "4px 6px" }}
          >
            {SMOKE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {error && (
          <span className="mono" style={{ fontSize: 11, color: "var(--status-5xx)" }}>{error}</span>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 14px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void onSave()}
            disabled={saving}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: "var(--radius-control)", border: "none", background: "var(--accent)", color: "var(--bg-app)", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
