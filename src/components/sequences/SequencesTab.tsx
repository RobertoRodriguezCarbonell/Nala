import { useEffect, useState } from "react";
import { useSequencesStore } from "../../store/sequencesStore";
import { useSavedRequestsStore } from "../../store/savedRequestsStore";
import { useServicesStore } from "../../store/servicesStore";
import { useConfirmStore } from "../../store/confirmStore";
import { listVariables } from "../../lib/tauri";
import { buildVarMap } from "../../lib/interpolate";
import { runSequence } from "../../lib/sequence";
import type { StepResult } from "../../lib/sequence";
import type { Sequence, SequenceStep } from "../../types/sequence";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { EmptyState } from "../ui/EmptyState";

export function SequencesTab({ serviceId }: { serviceId: number }) {
  const sequences = useSequencesStore((s) => s.byService[serviceId] ?? []);
  const loadSeqs = useSequencesStore((s) => s.load);
  const createSeq = useSequencesStore((s) => s.create);
  const updateSeq = useSequencesStore((s) => s.update);
  const removeSeq = useSequencesStore((s) => s.remove);

  const savedRequests = useSavedRequestsStore((s) => s.byService[serviceId] ?? []);
  const loadSaved = useSavedRequestsStore((s) => s.load);
  const confirm = useConfirmStore((s) => s.confirm);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadSeqs(serviceId);
    void loadSaved(serviceId);
  }, [serviceId, loadSeqs, loadSaved]);

  // Cargar la secuencia seleccionada en el editor.
  const selectSequence = (seq: Sequence) => {
    setSelectedId(seq.id);
    setName(seq.name);
    try {
      setSteps(JSON.parse(seq.stepsJson) as SequenceStep[]);
    } catch {
      setSteps([]);
    }
    setResults(null);
    setNotice(null);
  };

  const onNew = async () => {
    const created = await createSeq({ serviceId, name: "Nueva secuencia", stepsJson: "[]" });
    selectSequence(created);
  };

  const onSave = async () => {
    if (selectedId == null) return;
    await updateSeq(selectedId, serviceId, name.trim() || "Secuencia", JSON.stringify(steps));
    setNotice("Guardada ✓");
    setTimeout(() => setNotice(null), 1200);
  };

  const onDelete = () => {
    if (selectedId == null) return;
    const id = selectedId;
    confirm({
      title: "Borrar secuencia",
      message: `Se eliminará «${name}».`,
      confirmLabel: "Borrar",
      onConfirm: async () => {
        await removeSeq(id, serviceId);
        setSelectedId(null);
        setSteps([]);
        setResults(null);
      },
    });
  };

  const onRun = async () => {
    const svc = useServicesStore.getState();
    const envs = svc.environments[serviceId] ?? [];
    const env = envs.find((e) => e.id === svc.activeEnvironmentId) ?? envs[0] ?? null;
    if (!env) {
      setNotice("Selecciona un entorno activo.");
      return;
    }
    setNotice(null);
    setRunning(true);
    setResults(null);
    const variables = await listVariables(serviceId, env.id);
    const baseVarMap = buildVarMap(variables, serviceId, env.id, env.baseUrl);
    const res = await runSequence({ serviceId, steps, savedRequests, env, baseVarMap });
    setResults(res);
    setRunning(false);
  };

  // Mutadores de pasos.
  const patchStep = (i: number, patch: Partial<SequenceStep>) =>
    setSteps((ss) => ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addStep = () =>
    setSteps((ss) => [...ss, { savedRequestId: savedRequests[0]?.id ?? 0, extractions: [] }]);
  const removeStep = (i: number) => setSteps((ss) => ss.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: -1 | 1) =>
    setSteps((ss) => {
      const j = i + dir;
      if (j < 0 || j >= ss.length) return ss;
      const copy = [...ss];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  if (savedRequests.length === 0) {
    return <EmptyState text="Guarda peticiones primero (desde el constructor) para encadenarlas en una secuencia." />;
  }

  return (
    <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
      {/* Lista de secuencias */}
      <div style={{ width: 200, flex: "none", borderRight: "0.5px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ flex: "none", padding: "8px 10px", borderBottom: "0.5px solid var(--border-subtle)" }}>
          <Button variant="secondary" onClick={() => void onNew()} style={{ width: "100%" }}>+ Nueva secuencia</Button>
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {sequences.map((seq) => (
            <div
              key={seq.id}
              onClick={() => selectSequence(seq)}
              className="mono"
              style={{ padding: "8px 10px", fontSize: "var(--text-sm)", cursor: "pointer", color: selectedId === seq.id ? "var(--text-primary)" : "var(--text-secondary)", background: selectedId === seq.id ? "var(--bg-raised)" : "transparent", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {seq.name}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selectedId == null ? (
        <EmptyState text="Selecciona o crea una secuencia." />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderBottom: "0.5px solid var(--border)" }}>
            <Input value={name} onChange={setName} style={{ width: 240 }} />
            <div style={{ flex: 1 }} />
            {notice && <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{notice}</span>}
            <Button variant="secondary" onClick={() => void onSave()}>Guardar</Button>
            <Button variant="primary" onClick={() => void onRun()} disabled={running || steps.length === 0}>{running ? "Ejecutando…" : "Run"}</Button>
            <Button variant="danger" onClick={onDelete}>Borrar</Button>
          </div>

          <div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: "10px 13px", display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((step, i) => {
              const res = results?.[i];
              return (
                <div key={i} style={{ border: `0.5px solid ${res && !res.ok ? "var(--status-5xx)" : "var(--border-control)"}`, borderRadius: "var(--radius-control)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-faint)", width: 18 }}>{i + 1}</span>
                    <Select value={String(step.savedRequestId)} onChange={(v) => patchStep(i, { savedRequestId: Number(v) })} style={{ flex: 1 }}>
                      {!savedRequests.some((r) => r.id === step.savedRequestId) && <option value={String(step.savedRequestId)}>(petición no encontrada)</option>}
                      {savedRequests.map((r) => (
                        <option key={r.id} value={r.id}>{r.method} {r.name}</option>
                      ))}
                    </Select>
                    {res && <span className="mono" style={{ fontSize: "var(--text-xs)", color: res.ok ? "var(--status-2xx)" : "var(--status-5xx)" }}>{res.status ?? "ERR"}</span>}
                    <Button variant="ghost" onClick={() => moveStep(i, -1)} title="Subir" style={{ padding: "3px 7px" }}>↑</Button>
                    <Button variant="ghost" onClick={() => moveStep(i, 1)} title="Bajar" style={{ padding: "3px 7px" }}>↓</Button>
                    <Button variant="ghost" onClick={() => removeStep(i)} title="Quitar" style={{ padding: "3px 7px" }}>✕</Button>
                  </div>

                  {/* Extracciones */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 26 }}>
                    {step.extractions.map((ex, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Input value={ex.jsonPath} onChange={(v) => patchStep(i, { extractions: step.extractions.map((e, k) => (k === j ? { ...e, jsonPath: v } : e)) })} placeholder="$.access_token" style={{ flex: 1 }} />
                        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>→</span>
                        <Input value={ex.varName} onChange={(v) => patchStep(i, { extractions: step.extractions.map((e, k) => (k === j ? { ...e, varName: v } : e)) })} placeholder="token" style={{ flex: 1 }} />
                        <Button variant="ghost" onClick={() => patchStep(i, { extractions: step.extractions.filter((_, k) => k !== j) })} title="Quitar extracción" style={{ padding: "3px 7px" }}>✕</Button>
                      </div>
                    ))}
                    <span
                      onClick={() => patchStep(i, { extractions: [...step.extractions, { jsonPath: "", varName: "" }] })}
                      className="mono"
                      style={{ fontSize: "var(--text-micro)", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      + extracción
                    </span>
                    {res && Object.keys(res.extracted).length > 0 && (
                      <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--status-2xx)" }}>
                        {Object.entries(res.extracted).map(([k, v]) => `${k} = ${v}`).join("   ")}
                      </span>
                    )}
                    {res?.error && <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--status-5xx)" }}>{res.error}</span>}
                  </div>
                </div>
              );
            })}

            <Button variant="secondary" onClick={addStep} style={{ alignSelf: "flex-start" }}>+ Añadir paso</Button>
          </div>
        </div>
      )}
    </div>
  );
}
