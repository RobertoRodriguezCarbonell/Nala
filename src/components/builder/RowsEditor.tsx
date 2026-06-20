import { newRow, type Row } from "../../store/requestStore";

const cellInput: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  width: "100%",
  padding: "7px 10px",
};

/** Tabla editable de pares clave/valor con checkbox de activar por fila. */
export function RowsEditor({ rows, onChange }: { rows: Row[]; onChange: (rows: Row[]) => void }) {
  const update = (id: string, partial: Partial<Row>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add = () => onChange([...rows, newRow("", "", true)]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 30px", borderBottom: "0.5px solid var(--border-subtle)" }}>
        <div />
        <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", padding: "7px 10px", letterSpacing: "0.5px" }}>NOMBRE</div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", padding: "7px 10px", letterSpacing: "0.5px" }}>VALOR</div>
        <div />
      </div>

      {rows.map((r) => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 30px", alignItems: "center", borderBottom: "0.5px solid var(--border-row)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Checkbox on={r.enabled} onToggle={() => update(r.id, { enabled: !r.enabled })} />
          </div>
          <input style={{ ...cellInput, opacity: r.enabled ? 1 : 0.5 }} value={r.name} placeholder="nombre" onChange={(e) => update(r.id, { name: e.target.value })} />
          <input style={{ ...cellInput, opacity: r.enabled ? 1 : 0.5 }} value={r.value} placeholder="valor" onChange={(e) => update(r.id, { value: e.target.value })} />
          <div
            onClick={() => remove(r.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-disabled)", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-5xx)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-disabled)")}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
          </div>
        </div>
      ))}

      <div
        onClick={add}
        style={{ display: "grid", gridTemplateColumns: "32px 1fr", alignItems: "center", cursor: "pointer", opacity: 0.6 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 0" }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: "1px dashed var(--border-strong)" }} />
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-disabled)", padding: "7px 10px" }}>añadir…</div>
      </div>
    </div>
  );
}

export function Checkbox({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
        background: on ? "var(--accent)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {on && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4.5" stroke="var(--bg-app)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </div>
  );
}
