import { useMemo } from "react";
import { useRequestStore } from "../../store/requestStore";
import type { HttpResponse } from "../../types/http";

function statusColor(status: number): string {
  if (status >= 500) return "var(--status-5xx)";
  if (status >= 400) return "var(--status-4xx)";
  if (status >= 300) return "var(--status-3xx)";
  if (status >= 200) return "var(--status-2xx)";
  return "var(--text-muted)";
}

function fmtSize(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export function ResponseViewer() {
  const { tabs, tabStates, activeTabId, patch } = useRequestStore();
  const st = activeTabId ? tabStates[activeTabId] : null;
  const tab = tabs.find((t) => t.id === activeTabId) ?? null;

  if (!tab || !st) return <Empty text="Lanza una petición para ver la respuesta" />;
  if (st.sending) return <Spinner />;
  if (!st.response) {
    return <Empty text={st.error ? "La petición falló — revisa el constructor" : "Lanza una petición para ver la respuesta"} />;
  }

  const res = st.response;
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {/* Línea de estado */}
      <div style={{ height: 36, flex: "none", display: "flex", alignItems: "center", gap: 14, padding: "0 13px", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(res.status) }} />
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: statusColor(res.status) }}>{res.status} {res.statusText}</span>
        </div>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{res.timeMs} ms</span>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtSize(res.sizeBytes)}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 2 }}>
          {(["body", "headers"] as const).map((t) => (
            <div
              key={t}
              onClick={() => patch(tab.id, { responseTab: t })}
              style={{ display: "flex", alignItems: "center", padding: "0 9px", height: 24, fontFamily: "var(--font-mono)", fontSize: 11.5, cursor: "pointer", color: st.responseTab === t ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${st.responseTab === t ? "var(--accent)" : "transparent"}` }}
            >
              {t === "body" ? "Body" : `Headers (${res.headers.length})`}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {st.responseTab === "body" ? <Body res={res} /> : <Headers res={res} />}
      </div>
    </div>
  );
}

function Body({ res }: { res: HttpResponse }) {
  const pretty = useMemo(() => {
    const isJson = res.contentType?.includes("json") ?? false;
    try {
      if (isJson || res.body.trim().startsWith("{") || res.body.trim().startsWith("[")) {
        return { text: JSON.stringify(JSON.parse(res.body), null, 2), json: true };
      }
    } catch {
      /* no es JSON válido: se muestra crudo */
    }
    return { text: res.body, json: false };
  }, [res]);

  const lines = pretty.text.split("\n");
  return (
    <div className="mono" style={{ fontSize: 12, lineHeight: "19px", padding: "8px 0" }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
          <div style={{ width: 42, flex: "none", textAlign: "right", paddingRight: 12, color: "var(--text-linenum)", userSelect: "none" }}>{i + 1}</div>
          <div style={{ flex: 1, color: "var(--text-secondary)" }}>{pretty.json ? highlight(line) : line}</div>
        </div>
      ))}
    </div>
  );
}

function Headers({ res }: { res: HttpResponse }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {res.headers.map((h, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 240px) 1fr", gap: 10, padding: "5px 13px", borderBottom: "0.5px solid var(--border-row)" }}>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--accent-var)", wordBreak: "break-all" }}>{h.name}</span>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--text-secondary)", wordBreak: "break-all" }}>{h.value}</span>
        </div>
      ))}
    </div>
  );
}

const TOKEN_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;

/** Coloreado de sintaxis JSON mínimo, por línea. */
function highlight(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  let key = 0;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) nodes.push(<span key={key++} style={{ color: "var(--text-faint)" }}>{line.slice(last, m.index)}</span>);
    if (m[1] !== undefined) {
      // string: clave si va seguida de ':'
      const isKey = m[2] !== undefined;
      nodes.push(<span key={key++} style={{ color: isKey ? "var(--accent-var)" : "var(--method-get)" }}>{m[1]}</span>);
      if (isKey) nodes.push(<span key={key++} style={{ color: "var(--text-faint)" }}>{m[2]}</span>);
    } else if (m[3] !== undefined) {
      nodes.push(<span key={key++} style={{ color: "var(--syntax-number)" }}>{m[3]}</span>);
    } else if (m[4] !== undefined) {
      nodes.push(<span key={key++} style={{ color: "var(--syntax-bool)" }}>{m[4]}</span>);
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < line.length) nodes.push(<span key={key++} style={{ color: "var(--text-faint)" }}>{line.slice(last)}</span>);
  return nodes;
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>{text}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, height: "100%" }}>
      <div style={{ width: 26, height: 26, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "nala-spin 0.7s linear infinite" }} />
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>enviando petición…</span>
    </div>
  );
}
