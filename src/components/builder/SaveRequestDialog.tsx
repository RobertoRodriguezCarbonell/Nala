import { useState } from "react";
import { useSavedRequestsStore } from "../../store/savedRequestsStore";
import { draftFromTab, SMOKE_STATUS_OPTIONS } from "../../lib/request";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
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
    <Modal
      title="Guardar petición"
      onClose={onClose}
      width={380}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => void onSave()} disabled={saving}>Guardar</Button>
        </>
      }
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mono"
          style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "7px 10px", fontSize: "var(--text-sm)", color: "var(--text-secondary)", outline: "none" }}
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <input type="checkbox" checked={isSmoke} onChange={(e) => setIsSmoke(e.target.checked)} />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Marcar como smoke</span>
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", opacity: isSmoke ? 1 : 0.5 }}>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Status esperado</span>
        <select
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          disabled={!isSmoke}
          className="mono"
          style={{ fontSize: "var(--text-xs)", background: "var(--bg-input)", color: "var(--text-secondary)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: "4px 6px" }}
        >
          {SMOKE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      {error && (
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--status-5xx)" }}>{error}</span>
      )}
    </Modal>
  );
}
