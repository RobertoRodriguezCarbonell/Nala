import { useEffect } from "react";
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

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderBottom: "0.5px solid var(--border-subtle)" }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{list.length} ejecuciones</span>
        <button
          onClick={() => void clear(serviceId)}
          disabled={list.length === 0}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "5px 11px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: list.length === 0 ? "var(--text-disabled)" : "var(--status-5xx)", cursor: list.length === 0 ? "default" : "pointer" }}
        >
          Limpiar historial
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {list.length === 0 ? (
          <div style={{ padding: "24px 14px", textAlign: "center" }}>
            <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>Aún no hay ejecuciones para este servicio.</span>
          </div>
        ) : (
          list.map((e) => <HistoryRow key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "54px 1fr auto auto", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "0.5px solid var(--border-row)" }}>
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: methodColor(entry.method) }}>{entry.method}</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pathOf(entry.url)}</span>
      <span className="mono" style={{ fontSize: 11.5, color: statusColor(entry.status) }}>{entry.status ?? "ERR"}</span>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{entry.status != null ? `${entry.timeMs} ms` : ""}</span>
    </div>
  );
}
