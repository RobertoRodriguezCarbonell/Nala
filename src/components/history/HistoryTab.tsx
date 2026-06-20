import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useHistoryStore } from "../../store/historyStore";
import { methodColor } from "../MethodBadge";
import type { HistoryEntry } from "../../types/http";

export function statusColor(status: number | null | undefined): string {
  if (status == null) return "var(--status-5xx)";
  if (status >= 500) return "var(--status-5xx)";
  if (status >= 400) return "var(--status-4xx)";
  if (status >= 300) return "var(--status-3xx)";
  if (status >= 200) return "var(--status-2xx)";
  return "var(--text-faint)";
}

export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export function HistoryTab({ serviceId }: { serviceId: number }) {
  const entries = useHistoryStore((s) => s.byService[serviceId]);
  const load = useHistoryStore((s) => s.load);
  const clear = useHistoryStore((s) => s.clear);

  useEffect(() => {
    void load(serviceId);
  }, [serviceId, load]);

  const list = entries ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const resend = useHistoryStore((s) => s.resend);
  const [resending, setResending] = useState(false);

  const selected = list.find((e) => e.id === selectedId) ?? null;

  const onResend = async (entry: HistoryEntry) => {
    setResending(true);
    try {
      await resend(entry);
      // Tras reenviar, la nueva ejecución queda arriba; selecciónala.
      const fresh = useHistoryStore.getState().byService[serviceId] ?? [];
      setSelectedId(fresh[0]?.id ?? null);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderBottom: "0.5px solid var(--border-subtle)" }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{list.length} {list.length === 1 ? "ejecución" : "ejecuciones"}</span>
        <button
          onClick={() => { void clear(serviceId); setSelectedId(null); }}
          disabled={list.length === 0}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "5px 11px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: list.length === 0 ? "var(--text-disabled)" : "var(--status-5xx)", cursor: list.length === 0 ? "default" : "pointer" }}
        >
          Limpiar historial
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* Lista */}
        <div style={{ width: 300, flex: "none", overflowY: "auto", borderRight: "0.5px solid var(--border-subtle)" }}>
          {list.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center" }}>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>Aún no hay ejecuciones para este servicio.</span>
            </div>
          ) : (
            list.map((e) => (
              <HistoryRow key={e.id} entry={e} selected={e.id === selectedId} onClick={() => setSelectedId(e.id)} />
            ))
          )}
        </div>

        {/* Detalle */}
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {selected ? (
            <HistoryDetail entry={selected} resending={resending} onResend={() => void onResend(selected)} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>Selecciona una ejecución.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ entry, selected, onClick }: { entry: HistoryEntry; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "0.5px solid var(--border-row)", cursor: "pointer", background: selected ? "var(--bg-raised)" : "transparent" }}
    >
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: methodColor(entry.method) }}>{entry.method}</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pathOf(entry.url)}</span>
      <span className="mono" style={{ fontSize: 11, color: statusColor(entry.status) }}>{entry.status ?? "ERR"}</span>
    </div>
  );
}

function HistoryDetail({ entry, resending, onResend }: { entry: HistoryEntry; resending: boolean; onResend: () => void }) {
  const sec: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.5px", padding: "10px 12px 4px" };
  const pre: CSSProperties = { margin: 0, padding: "4px 12px 10px", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-secondary)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "0.5px solid var(--border-subtle)" }}>
        <span className="mono" style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11.5, color: statusColor(entry.status) }}>
          {entry.status != null
            ? `${entry.status} ${entry.statusText}`
            : entry.error
            ? `Error: ${entry.error}`
            : "Error de red"} · {entry.timeMs} ms · {entry.sizeBytes} B
        </span>
        <button
          onClick={onResend}
          disabled={resending}
          style={{ flex: "none", marginLeft: 10, fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "5px 13px", borderRadius: "var(--radius-control)", border: "none", background: "var(--accent)", color: "var(--bg-app)", cursor: resending ? "default" : "pointer", opacity: resending ? 0.6 : 1 }}
        >
          {resending ? "Reenviando…" : "Reenviar"}
        </button>
      </div>

      <div style={sec}>REQUEST</div>
      <div style={pre}>{entry.method} {entry.url}</div>
      {entry.requestHeaders.length > 0 && (
        <div style={pre}>{entry.requestHeaders.map((h) => `${h.name}: ${h.value}`).join("\n")}</div>
      )}
      {entry.requestBody && <div style={pre}>{entry.requestBody}</div>}

      <div style={sec}>RESPONSE</div>
      {entry.responseHeaders.length > 0 && (
        <div style={pre}>{entry.responseHeaders.map((h) => `${h.name}: ${h.value}`).join("\n")}</div>
      )}
      <div style={pre}>{entry.responseBody || (entry.error ?? "")}</div>
    </div>
  );
}
