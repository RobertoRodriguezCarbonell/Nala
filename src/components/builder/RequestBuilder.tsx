import { useState } from "react";
import { useRequestStore } from "../../store/requestStore";
import { useServicesStore } from "../../store/servicesStore";
import { methodColor } from "../MethodBadge";
import { RowsEditor } from "./RowsEditor";
import { SchemaForm } from "./SchemaForm";
import { AuthPanel } from "./AuthPanel";
import { SaveRequestDialog } from "./SaveRequestDialog";
import type { BuilderTab } from "../../store/requestStore";
import type { Operation } from "../../types/openapi";

export function RequestBuilder() {
  const { tabs, tabStates, activeTabId, patch, setBodyMode, send } = useRequestStore();
  const specs = useServicesStore((s) => s.specs);

  const tab = tabs.find((t) => t.id === activeTabId) ?? null;
  const st = activeTabId ? tabStates[activeTabId] : null;
  const [saveOpen, setSaveOpen] = useState(false);
  if (!tab || !st) {
    return <Centered text="Selecciona un endpoint en el árbol" />;
  }

  const op: Operation | undefined = specs[tab.serviceId]?.operations.find(
    (o) => o.method === tab.method && o.path === tab.path
  );

  const pathNames = Object.keys(st.pathParams);
  const builderTabs: { key: BuilderTab; label: string; badge?: number }[] = [
    { key: "params", label: "Params", badge: pathNames.length + st.query.filter((r) => r.enabled).length || undefined },
    { key: "body", label: "Body" },
    { key: "headers", label: "Headers", badge: st.headers.filter((r) => r.enabled).length || undefined },
    { key: "auth", label: "Auth" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {/* Fila de URL */}
      <div style={{ flex: "none", padding: "11px 12px", borderBottom: "0.5px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-input)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: "6px 11px" }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: methodColor(tab.method) }}>{tab.method}</span>
        </div>
        <div className="mono" style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-control)", padding: "7px 11px", fontSize: 12.5, overflow: "hidden", whiteSpace: "nowrap" }}>
          <span style={{ color: "var(--accent)" }}>{"{{"}</span>
          <span style={{ color: "var(--accent-var)" }}>baseUrl</span>
          <span style={{ color: "var(--accent)" }}>{"}}"}</span>
          <span style={{ color: "var(--text-secondary)" }}>{renderPath(tab.path, st.pathParams)}</span>
          <span style={{ color: "var(--text-faint)" }}>{renderQuery(st.query)}</span>
        </div>
        <button
          onClick={() => setSaveOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: "8px 14px", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}
        >
          Guardar
        </button>
        <button
          onClick={() => void send(tab.id)}
          disabled={st.sending}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--accent)", border: "none", borderRadius: "var(--radius-control)", padding: "8px 16px", cursor: st.sending ? "default" : "pointer", color: "var(--bg-app)", opacity: st.sending ? 0.7 : 1 }}
        >
          {st.sending ? (
            <span style={{ width: 12, height: 12, border: "2px solid rgba(10,10,11,0.3)", borderTopColor: "var(--bg-app)", borderRadius: "50%", animation: "nala-spin 0.7s linear infinite" }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.5 2L12 7L2.5 12V2Z" fill="var(--bg-app)" /></svg>
          )}
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{st.sending ? "Enviando…" : "Enviar"}</span>
        </button>
      </div>

      {/* Pestañas del constructor */}
      <div style={{ flex: "none", display: "flex", alignItems: "stretch", height: 33, padding: "0 12px", gap: 4, borderBottom: "0.5px solid var(--border-subtle)" }}>
        {builderTabs.map((bt) => (
          <div
            key={bt.key}
            onClick={() => patch(tab.id, { builderTab: bt.key })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 9px", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer", color: st.builderTab === bt.key ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${st.builderTab === bt.key ? "var(--accent)" : "transparent"}` }}
          >
            {bt.label}
            {bt.badge != null && (
              <span className="mono" style={{ fontSize: 9.5, color: "var(--bg-app)", background: "var(--accent)", borderRadius: 8, padding: "0 5px", fontWeight: 600 }}>{bt.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje de error de validación / red */}
      {st.error && (
        <div className="mono" style={{ flex: "none", fontSize: 11.5, color: "var(--status-5xx)", padding: "8px 12px", borderBottom: "0.5px solid var(--border-subtle)", background: "rgba(248,81,73,0.06)" }}>
          {st.error}
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {st.builderTab === "params" && (
          <div>
            {pathNames.length > 0 && (
              <div style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", padding: "8px 12px 4px", letterSpacing: "0.5px" }}>PATH</div>
                {pathNames.map((name) => (
                  <div key={name} style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "center", borderTop: "0.5px solid var(--border-row)" }}>
                    <div style={{ padding: "8px 12px" }}>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{name}<span style={{ color: "var(--syntax-required)" }}> *</span></span>
                    </div>
                    <div style={{ padding: "6px 12px 6px 0" }}>
                      <input
                        className="mono"
                        value={st.pathParams[name]}
                        onChange={(e) => patch(tab.id, { pathParams: { ...st.pathParams, [name]: e.target.value } })}
                        placeholder={`{${name}}`}
                        style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "7px 10px", fontSize: 12, color: "var(--text-secondary)", outline: "none", width: "100%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", padding: "8px 12px 0", letterSpacing: "0.5px" }}>QUERY</div>
            <RowsEditor rows={st.query} onChange={(rows) => patch(tab.id, { query: rows })} />
          </div>
        )}

        {st.builderTab === "body" && (
          <BodySection op={op} tabId={tab.id} st={st} patch={patch} setBodyMode={setBodyMode} />
        )}

        {st.builderTab === "headers" && (
          <RowsEditor rows={st.headers} onChange={(rows) => patch(tab.id, { headers: rows })} />
        )}

        {st.builderTab === "auth" && <AuthPanel serviceId={tab.serviceId} />}
      </div>
      {saveOpen && (
        <SaveRequestDialog
          tab={tab}
          st={st}
          operationId={op?.operationId}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </div>
  );
}

function BodySection({
  op,
  tabId,
  st,
  patch,
  setBodyMode,
}: {
  op: Operation | undefined;
  tabId: string;
  st: ReturnType<typeof useRequestStore.getState>["tabStates"][string];
  patch: ReturnType<typeof useRequestStore.getState>["patch"];
  setBodyMode: ReturnType<typeof useRequestStore.getState>["setBodyMode"];
}) {
  if (!st.hasBody || !op?.requestBody) {
    return <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)", padding: "18px 14px" }}>Esta operación no tiene cuerpo de petición.</div>;
  }
  const schema = op.requestBody.schema;

  const seg = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-mono)",
    fontSize: 11.5,
    padding: "4px 11px",
    borderRadius: 4,
    cursor: "pointer",
    background: active ? "var(--bg-raised)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-faint)",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderBottom: "0.5px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{op.requestBody.contentType}</span>
          {schema.refName && <span className="mono" style={{ fontSize: 12, color: "var(--syntax-type)" }}>{schema.refName}</span>}
        </div>
        <div style={{ display: "flex", background: "var(--bg-input)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: 2 }}>
          <div style={seg(st.bodyMode === "form")} onClick={() => setBodyMode(tabId, "form")}>Form</div>
          <div style={seg(st.bodyMode === "json")} onClick={() => setBodyMode(tabId, "json")}>JSON crudo</div>
        </div>
      </div>

      {st.bodyMode === "form" ? (
        <SchemaForm schema={schema} value={st.bodyForm} onChange={(v) => patch(tabId, { bodyForm: v })} />
      ) : (
        <textarea
          className="mono"
          value={st.bodyJson}
          onChange={(e) => patch(tabId, { bodyJson: e.target.value })}
          spellCheck={false}
          style={{ width: "100%", minHeight: 260, background: "var(--bg-app)", border: "none", outline: "none", color: "var(--text-secondary)", fontSize: 12, lineHeight: "19px", padding: "10px 12px", resize: "vertical" }}
        />
      )}
    </div>
  );
}

function renderPath(path: string, params: Record<string, string>): string {
  return path.replace(/\{([^}]+)\}/g, (_, n) => (params[n] ? params[n] : `{${n}}`));
}

function renderQuery(rows: { name: string; value: string; enabled: boolean }[]): string {
  const qs = rows.filter((r) => r.enabled && r.name.trim()).map((r) => `${r.name}=${r.value}`).join("&");
  return qs ? `?${qs}` : "";
}

function Centered({ text }: { text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>{text}</span>
    </div>
  );
}
