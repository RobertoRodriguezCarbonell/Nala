import { useState } from "react";
import { useSavedRequestsStore } from "../../store/savedRequestsStore";
import { draftFromTab, SMOKE_STATUS_OPTIONS } from "../../lib/request";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Checkbox } from "../ui/Checkbox";
import { Field } from "../ui/Field";
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
      {/* Etiqueta vertical → Field */}
      <Field label="Nombre">
        <Input value={name} onChange={setName} />
      </Field>

      {/* Etiqueta horizontal → label nativo + Checkbox primitiva */}
      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <Checkbox on={isSmoke} onToggle={() => setIsSmoke(!isSmoke)} />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Marcar como smoke</span>
      </label>

      {/* Etiqueta horizontal → label nativo + Select primitiva */}
      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", opacity: isSmoke ? 1 : 0.5 }}>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Status esperado</span>
        <Select value={expected} onChange={setExpected} disabled={!isSmoke}>
          {SMOKE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </label>

      {error && (
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--status-5xx)" }}>{error}</span>
      )}
    </Modal>
  );
}
