import { useEffect, useState } from "react";
import { useVariablesStore } from "../../store/variablesStore";
import { useServicesStore } from "../../store/servicesStore";
import { useConfirmStore } from "../../store/confirmStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { VariableScope } from "../../types/http";

/**
 * Gestor de variables `{{var}}` por ámbito (global / servicio / entorno).
 * En F3 maneja variables no secretas; el cifrado de secretos llega en F4.
 */
export function VariablesManager() {
  const { variables, closeManager, load, save, remove } = useVariablesStore();
  const { activeServiceId, activeEnvironmentId, services } = useServicesStore();
  const confirm = useConfirmStore((s) => s.confirm);

  const serviceName = services.find((s) => s.id === activeServiceId)?.name ?? "servicio";

  const [scope, setScope] = useState<VariableScope>("global");
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  useEffect(() => {
    void load(activeServiceId ?? undefined, activeEnvironmentId ?? undefined);
  }, [load, activeServiceId, activeEnvironmentId]);

  const scopeId = (s: VariableScope): number | null =>
    s === "service" ? activeServiceId : s === "environment" ? activeEnvironmentId : null;

  const canAdd = key.trim() !== "" && !(scope !== "global" && scopeId(scope) == null);

  async function add() {
    if (!canAdd) return;
    await save(
      { scope, scopeId: scopeId(scope), key: key.trim(), value: val },
      activeServiceId ?? undefined,
      activeEnvironmentId ?? undefined
    );
    setKey("");
    setVal("");
  }

  const scopeLabel = (s: VariableScope) => (s === "global" ? "global" : s === "service" ? serviceName : "entorno");

  return (
    <Modal
      title="Variables"
      onClose={closeManager}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={closeManager}>Cerrar</Button>
          <Button variant="primary" onClick={() => void add()} disabled={!canAdd}>Añadir</Button>
        </>
      }
    >
      {/* Subtítulo con la regla de resolución de ámbito */}
      <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>{"{{var}}"} · entorno &gt; servicio &gt; global</span>

      {/* Lista de variables */}
      <div style={{ maxHeight: "calc(80vh - 180px)", overflowY: "auto", margin: "0 -16px" }}>
        {variables.length === 0 ? (
          <div className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)", padding: "20px", textAlign: "center" }}>
            Aún no hay variables. Añade una abajo. <br />
            Recuerda: <span style={{ color: "var(--accent-var)" }}>{"{{baseUrl}}"}</span> ya existe por entorno.
          </div>
        ) : (
          variables.map((v) => (
            <div key={v.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 28px", alignItems: "center", gap: 8, padding: "7px 14px", borderBottom: "0.5px solid var(--border-row)" }}>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{scopeLabel(v.scope)}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--accent-var)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.key}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.isSecret ? "••••" : v.value}</span>
              <span
                onClick={() =>
                  confirm({
                    title: "Eliminar variable",
                    message: `Se eliminará la variable «${v.key}».`,
                    confirmLabel: "Eliminar",
                    onConfirm: () => remove(v.id, activeServiceId ?? undefined, activeEnvironmentId ?? undefined),
                  })
                }
                style={{ display: "flex", justifyContent: "center", color: "var(--text-disabled)", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-5xx)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-disabled)")}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Fila de nueva variable */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "0 -16px", padding: "12px 16px 0", borderTop: "0.5px solid var(--border)" }}>
        <select value={scope} onChange={(e) => setScope(e.target.value as VariableScope)} style={selStyle}>
          <option value="global">global</option>
          <option value="service" disabled={activeServiceId == null}>{serviceName}</option>
          <option value="environment" disabled={activeEnvironmentId == null}>entorno</option>
        </select>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="clave" style={{ ...inp, flex: 1 }} />
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="valor" style={{ ...inp, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && void add()} />
      </div>
    </Modal>
  );
}

const inp: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  padding: "7px 10px",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-primary)",
  outline: "none",
  minWidth: 0,
};

const selStyle: React.CSSProperties = { ...inp, cursor: "pointer", width: 110, flex: "none" };
