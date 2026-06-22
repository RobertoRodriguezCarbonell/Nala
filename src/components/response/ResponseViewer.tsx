import { useEffect, useMemo, useState } from "react";
import { useRequestStore } from "../../store/requestStore";
import type { HttpResponse } from "../../types/http";
import { EmptyState } from "../ui/EmptyState";

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

  if (!tab || !st) return <EmptyState text="Lanza una petición para ver la respuesta" />;
  if (st.sending) return <EmptyState text="enviando petición…" spinner />;
  if (!st.response) {
    return <EmptyState text={st.error ? "La petición falló — revisa el constructor" : "Lanza una petición para ver la respuesta"} />;
  }

  const res = st.response;
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {/* Línea de estado */}
      <div style={{ height: 36, flex: "none", display: "flex", alignItems: "center", gap: 14, padding: "0 13px", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(res.status) }} />
          <span className="mono" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: statusColor(res.status) }}>{res.status} {res.statusText}</span>
        </div>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{res.timeMs} ms</span>
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{fmtSize(res.sizeBytes)}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 2 }}>
          {(["body", "headers"] as const).map((t) => (
            <div
              key={t}
              onClick={() => patch(tab.id, { responseTab: t })}
              style={{ display: "flex", alignItems: "center", padding: "0 9px", height: 24, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", cursor: "pointer", color: st.responseTab === t ? "var(--text-primary)" : "var(--text-faint)", borderBottom: `2px solid ${st.responseTab === t ? "var(--accent)" : "transparent"}` }}
            >
              {t === "body" ? "Body" : `Headers (${res.headers.length})`}
            </div>
          ))}
        </div>
      </div>

      {st.responseTab === "body" ? (
        <Body res={res} />
      ) : (
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Headers res={res} />
        </div>
      )}
    </div>
  );
}

const PAGE = 500;

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

  const lines = useMemo(() => pretty.text.split("\n"), [pretty.text]);
  const paginated = lines.length > PAGE;
  const pageCount = Math.max(1, Math.ceil(lines.length / PAGE));

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0); // nueva respuesta → vuelve a la primera página
  }, [pretty.text]);
  const safePage = Math.min(page, pageCount - 1);

  const start = paginated ? safePage * PAGE : 0;
  const shown = paginated ? lines.slice(start, start + PAGE) : lines;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <div className="mono" style={{ fontSize: "var(--text-sm)", lineHeight: "19px", padding: "8px 0" }}>
          {shown.map((line, i) => (
            <div key={start + i} style={{ display: "flex", whiteSpace: "pre" }}>
              <div style={{ width: 42, flex: "none", textAlign: "right", paddingRight: 12, color: "var(--text-linenum)", userSelect: "none" }}>{start + i + 1}</div>
              <div style={{ flex: 1, color: "var(--text-secondary)", userSelect: "text", cursor: "text" }}>{pretty.json ? highlight(line) : line}</div>
            </div>
          ))}
        </div>
      </div>

      {paginated && (
        <div style={{ flex: "none", height: 30, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, borderTop: "0.5px solid var(--border)" }}>
          <PagerBtn label="«" disabled={safePage === 0} onClick={() => setPage(0)} />
          <PagerBtn label="‹" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} />
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", padding: "0 8px" }}>Página {safePage + 1} / {pageCount}</span>
          <PagerBtn label="›" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} />
          <PagerBtn label="»" disabled={safePage >= pageCount - 1} onClick={() => setPage(pageCount - 1)} />
        </div>
      )}

      <CopyButton text={pretty.text} />
    </div>
  );
}

function PagerBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", width: 26, height: 22, borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: disabled ? "var(--text-disabled)" : "var(--text-secondary)", cursor: disabled ? "default" : "pointer" }}
    >
      {label}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* portapapeles no disponible */
    }
  };
  return (
    <button
      onClick={() => void onCopy()}
      title="Copiar respuesta"
      style={{ position: "absolute", top: 8, right: 14, zIndex: 5, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", padding: "4px 10px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "var(--bg-input)", color: copied ? "var(--status-2xx)" : "var(--text-secondary)", cursor: "pointer" }}
    >
      {copied ? "Copiado ✓" : "Copiar"}
    </button>
  );
}

function Headers({ res }: { res: HttpResponse }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {res.headers.map((h, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 240px) 1fr", gap: 10, padding: "5px 13px", borderBottom: "0.5px solid var(--border-row)" }}>
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--accent-var)", wordBreak: "break-all" }}>{h.name}</span>
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", wordBreak: "break-all" }}>{h.value}</span>
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

