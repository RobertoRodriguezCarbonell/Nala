import { useEffect, useMemo, useState } from "react";
import { listSnapshots, diffSnapshots } from "../../lib/tauri";
import type { SnapshotMeta } from "../../lib/tauri";
import type { SchemaDiff, Change } from "../../types/diff";
import { EmptyState } from "../ui/EmptyState";
import { Select } from "../ui/Select";

/**
 * Pestaña "Diff de esquema": elige dos snapshots de un servicio y muestra los
 * cambios entre ellos (endpoints, params, body, respuesta) marcando los breaking.
 */
export function DiffTab({ serviceId }: { serviceId: number }) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[] | null>(null);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar la lista de snapshots al cambiar de servicio.
  useEffect(() => {
    let alive = true;
    setSnapshots(null);
    setDiff(null);
    setError(null);
    listSnapshots(serviceId)
      .then((list) => {
        if (!alive) return;
        setSnapshots(list);
        // list viene en orden DESC (más nuevo primero).
        setToId(list[0]?.id ?? null);
        setFromId(list[1]?.id ?? null);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [serviceId]);

  // Recalcular el diff cuando cambian las selecciones.
  useEffect(() => {
    let alive = true;
    if (fromId == null || toId == null || fromId === toId) {
      setDiff(null);
      return;
    }
    setError(null);
    diffSnapshots(serviceId, fromId, toId)
      .then((d) => {
        if (alive) setDiff(d);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [serviceId, fromId, toId]);

  // Agrupar cambios por endpoint, con los breaking primero dentro de cada grupo.
  const groups = useMemo(() => groupChanges(diff?.changes ?? []), [diff]);

  if (error) return <EmptyState text={error} />;
  if (snapshots == null) return <EmptyState text="cargando snapshots…" />;
  if (snapshots.length < 2) {
    return <EmptyState text="Refresca el servicio para crear otro snapshot y poder comparar." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderBottom: "0.5px solid var(--border)" }}>
        <SnapshotSelect label="De" value={fromId} options={snapshots} onChange={setFromId} />
        <span className="mono" style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>→</span>
        <SnapshotSelect label="A" value={toId} options={snapshots} onChange={setToId} />
        <div style={{ flex: 1 }} />
        {diff && (
          <div style={{ display: "flex", gap: 10 }}>
            <span className="mono" style={{ fontSize: "var(--text-xs)", color: diff.breakingCount > 0 ? "var(--status-5xx)" : "var(--text-faint)" }}>
              {diff.breakingCount} breaking
            </span>
            <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {diff.nonBreakingCount} no-breaking
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: "8px 0" }}>
        {fromId === toId ? (
          <EmptyState text="Elige dos snapshots distintos." />
        ) : diff == null ? (
          <EmptyState text="calculando diff…" />
        ) : groups.length === 0 ? (
          <EmptyState text="Sin cambios entre estos snapshots." />
        ) : (
          groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 6 }}>
              <div className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", padding: "4px 13px" }}>{g.key}</div>
              {g.changes.map((c, i) => (
                <ChangeRow key={i} change={c} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface Group {
  key: string;
  changes: Change[];
}

function groupChanges(changes: Change[]): Group[] {
  const map = new Map<string, Change[]>();
  for (const c of changes) {
    const key = `${c.method} ${c.path}`;
    const arr = map.get(key) ?? [];
    arr.push(c);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([key, arr]) => ({
    key,
    // breaking primero, conservando el orden estable de Rust dentro de cada mitad.
    changes: [...arr.filter((c) => c.breaking), ...arr.filter((c) => !c.breaking)],
  }));
}

function ChangeRow({ change }: { change: Change }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 13px 5px 22px" }}>
      <span
        style={{ flex: "none", width: 6, height: 6, borderRadius: "50%", background: change.breaking ? "var(--status-5xx)" : "var(--text-disabled)" }}
      />
      <span style={{ fontSize: "var(--text-sm)", color: change.breaking ? "var(--text-primary)" : "var(--text-secondary)" }}>{change.summary}</span>
      {change.breaking && (
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--status-5xx)", border: "0.5px solid var(--status-5xx)", borderRadius: 4, padding: "0 5px" }}>breaking</span>
      )}
    </div>
  );
}

function SnapshotSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: SnapshotMeta[];
  onChange: (id: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{label}</span>
      <Select value={String(value ?? "")} onChange={(v) => onChange(Number(v))} style={{ fontSize: "var(--text-xs)" }}>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {(s.apiVersion ?? "—") + " · " + s.fetchedAt + " · " + s.endpointCount + " endpoints"}
          </option>
        ))}
      </Select>
    </label>
  );
}

