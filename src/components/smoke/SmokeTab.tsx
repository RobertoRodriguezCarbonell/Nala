import { useEffect, useState } from "react";
import { useSavedRequestsStore } from "../../store/savedRequestsStore";
import { useServicesStore } from "../../store/servicesStore";
import { useConfirmStore } from "../../store/confirmStore";
import { EmptyState } from "../ui/EmptyState";
import { listVariables, sendRequest } from "../../lib/tauri";
import { buildVarMap } from "../../lib/interpolate";
import { buildHttpRequest, matchesExpected, SMOKE_STATUS_OPTIONS } from "../../lib/request";
import type { RequestDraft } from "../../lib/request";
import { methodColor } from "../MethodBadge";

interface SmokeResult {
  id: number;
  status?: number;
  ok: boolean;
  error?: string;
}

export function SmokeTab({ serviceId }: { serviceId: number }) {
  const byService = useSavedRequestsStore((s) => s.byService);
  const load = useSavedRequestsStore((s) => s.load);
  const update = useSavedRequestsStore((s) => s.update);
  const remove = useSavedRequestsStore((s) => s.remove);
  const confirm = useConfirmStore((s) => s.confirm);

  const [results, setResults] = useState<Record<number, SmokeResult>>({});
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void load(serviceId);
    setResults({});
    setNotice(null);
  }, [serviceId, load]);

  const requests = byService[serviceId] ?? [];
  const smoke = requests.filter((r) => r.isSmoke);

  const runSmoke = async () => {
    const svc = useServicesStore.getState();
    const envs = svc.environments[serviceId] ?? [];
    const env = envs.find((e) => e.id === svc.activeEnvironmentId) ?? envs[0] ?? null;
    if (!env) {
      setNotice("Selecciona un entorno activo para ejecutar el smoke.");
      return;
    }
    setNotice(null);
    setRunning(true);
    setResults({});

    const variables = await listVariables(serviceId, env.id);
    const map = buildVarMap(variables, serviceId, env.id, env.baseUrl);

    const out: Record<number, SmokeResult> = {};
    for (const r of smoke) {
      try {
        const draft = JSON.parse(r.draftJson) as RequestDraft;
        const input = buildHttpRequest({
          method: r.method,
          path: r.path,
          draft,
          baseUrl: env.baseUrl,
          varMap: map,
          auth: { serviceId, environmentId: env.id },
          meta: { serviceId, environmentId: env.id, skipHistory: true },
        });
        const res = await sendRequest(input);
        out[r.id] = { id: r.id, status: res.status, ok: matchesExpected(res.status, r.expectedStatus) };
      } catch (e) {
        out[r.id] = { id: r.id, ok: false, error: typeof e === "string" ? e : String(e) };
      }
      setResults({ ...out });
    }
    setRunning(false);
  };

  const passed = smoke.filter((r) => results[r.id]?.ok).length;
  const failed = smoke.filter((r) => results[r.id] && !results[r.id].ok).length;

  if (requests.length === 0) {
    return <EmptyState text="Guarda una petición como smoke desde el constructor para empezar." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "8px 13px", borderBottom: "0.5px solid var(--border)" }}>
        <button
          onClick={() => void runSmoke()}
          disabled={running || smoke.length === 0}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: "var(--radius-control)", border: "none", background: "var(--accent)", color: "var(--bg-app)", cursor: running || smoke.length === 0 ? "default" : "pointer", opacity: running || smoke.length === 0 ? 0.6 : 1 }}
        >
          {running ? "Ejecutando…" : "Run smoke"}
        </button>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{smoke.length} smoke</span>
        {(passed > 0 || failed > 0) && (
          <div style={{ display: "flex", gap: 10 }}>
            <span className="mono" style={{ fontSize: 11.5, color: "var(--status-2xx)" }}>{passed} verdes</span>
            <span className="mono" style={{ fontSize: 11.5, color: failed > 0 ? "var(--status-5xx)" : "var(--text-faint)" }}>{failed} rojas</span>
          </div>
        )}
        {notice && <span className="mono" style={{ fontSize: 11.5, color: "var(--status-4xx)" }}>{notice}</span>}
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {requests.map((r) => {
          const res = results[r.id];
          return (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "auto 56px 1fr auto auto auto", alignItems: "center", gap: 10, padding: "8px 13px", borderBottom: "0.5px solid var(--border-row)" }}>
              <input type="checkbox" checked={r.isSmoke} onChange={(e) => void update(r.id, serviceId, r.name, e.target.checked, r.expectedStatus)} />
              <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: methodColor(r.method) }}>{r.method}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.path}</div>
              </div>
              <select
                value={r.expectedStatus}
                onChange={(e) => void update(r.id, serviceId, r.name, r.isSmoke, e.target.value)}
                className="mono"
                style={{ fontSize: 11, background: "var(--bg-input)", color: "var(--text-secondary)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: "3px 5px" }}
              >
                {SMOKE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="mono" style={{ fontSize: 11, minWidth: 44, textAlign: "right", color: res ? (res.ok ? "var(--status-2xx)" : "var(--status-5xx)") : "var(--text-disabled)" }}>
                {res ? (res.status ?? "ERR") : "—"}
              </span>
              <button
                onClick={() =>
                  confirm({
                    title: "Borrar petición guardada",
                    message: `Se eliminará «${r.name}».`,
                    confirmLabel: "Borrar",
                    onConfirm: () => remove(r.id, serviceId),
                  })
                }
                title="Borrar"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "3px 8px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: "var(--text-faint)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

