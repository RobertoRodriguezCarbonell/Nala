import type { Schema } from "../../types/openapi";
import { defaultForSchema, primaryType, typeHint } from "../../lib/schema";

/**
 * Formulario generado desde el esquema normalizado. Recorre el `Schema` y mapea
 * cada tipo a su input: string→texto, enum→select, bool→toggle, number→numérico,
 * array→lista repetible, object/$ref→anidado.
 */
export function SchemaForm({
  schema,
  value,
  onChange,
}: {
  schema: Schema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  // El body de FastAPI casi siempre es un objeto: renderizamos sus propiedades.
  if (primaryType(schema) === "object" && schema.properties?.length) {
    return <ObjectFields schema={schema} value={value} onChange={onChange} />;
  }
  return (
    <div style={{ padding: "8px 12px" }}>
      <Control schema={schema} value={value} onChange={onChange} />
    </div>
  );
}

function ObjectFields({
  schema,
  value,
  onChange,
}: {
  schema: Schema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const setKey = (k: string, v: unknown) => onChange({ ...obj, [k]: v });

  return (
    <div>
      {(schema.properties ?? []).map((p) => (
        <FieldRow
          key={p.name}
          name={p.name}
          required={p.required}
          schema={p.schema}
          value={obj[p.name]}
          onChange={(v) => setKey(p.name, v)}
        />
      ))}
    </div>
  );
}

function FieldRow({
  name,
  required,
  schema,
  value,
  onChange,
}: {
  name: string;
  required: boolean;
  schema: Schema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const nested = primaryType(schema) === "object" && (schema.properties?.length ?? 0) > 0;
  const isArray = primaryType(schema) === "array";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        alignItems: nested || isArray ? "start" : "center",
        borderBottom: "0.5px solid var(--border-row)",
      }}
    >
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {name}
          {required && <span style={{ color: "var(--syntax-required)" }}> *</span>}
        </span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-disabled)" }}>{typeHint(schema)}</span>
      </div>
      <div style={{ padding: "7px 12px 7px 0" }}>
        <Control schema={schema} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  padding: "7px 10px",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  outline: "none",
  width: "100%",
};

function Control({
  schema,
  value,
  onChange,
}: {
  schema: Schema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const t = primaryType(schema);

  if (schema.enumValues && schema.enumValues.length) {
    return (
      <select
        style={{ ...inputStyle, cursor: "pointer" }}
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {schema.enumValues.map((ev) => (
          <option key={String(ev)} value={String(ev)}>{String(ev)}</option>
        ))}
      </select>
    );
  }

  if (t === "boolean") {
    const on = value === true;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          onClick={() => onChange(!on)}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            background: on ? "var(--accent)" : "var(--border-control)",
            position: "relative",
            cursor: "pointer",
            transition: "background .12s",
          }}
        >
          <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "var(--bg-app)", transition: "left .12s" }} />
        </div>
        <span className="mono" style={{ fontSize: 12, color: "var(--syntax-bool)" }}>{String(on)}</span>
      </div>
    );
  }

  if (t === "array") {
    return <ArrayControl schema={schema} value={value} onChange={onChange} />;
  }

  if (t === "object" && schema.properties?.length) {
    return (
      <div style={{ borderLeft: "2px solid var(--border-input)", paddingLeft: 0 }}>
        <ObjectFields schema={schema} value={value} onChange={onChange} />
      </div>
    );
  }

  if (t === "integer" || t === "number") {
    return (
      <input
        type="number"
        style={inputStyle}
        value={value === "" || value == null ? "" : Number(value)}
        min={schema.minimum}
        max={schema.maximum}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={schema.example != null ? String(schema.example) : ""}
      />
    );
  }

  const inputType = schema.format === "password" ? "password" : "text";
  return (
    <input
      type={inputType}
      style={inputStyle}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={schema.example != null ? String(schema.example) : schema.format ?? ""}
    />
  );
}

function ArrayControl({
  schema,
  value,
  onChange,
}: {
  schema: Schema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const arr = Array.isArray(value) ? value : [];
  const items = schema.items;

  const setAt = (i: number, v: unknown) => onChange(arr.map((x, idx) => (idx === i ? v : x)));
  const removeAt = (i: number) => onChange(arr.filter((_, idx) => idx !== i));
  const add = () => onChange([...arr, items ? defaultForSchema(items) : ""]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {arr.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "start", gap: 6 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-disabled)", width: 14, paddingTop: 8 }}>{i}</span>
          <div style={{ flex: 1 }}>
            {items ? (
              <Control schema={items} value={item} onChange={(v) => setAt(i, v)} />
            ) : (
              <input style={inputStyle} value={String(item ?? "")} onChange={(e) => setAt(i, e.target.value)} />
            )}
          </div>
          <span
            onClick={() => removeAt(i)}
            style={{ color: "var(--text-disabled)", cursor: "pointer", paddingTop: 7 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-5xx)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-disabled)")}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
          </span>
        </div>
      ))}
      <div
        onClick={add}
        style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11.5, paddingLeft: 20 }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2.5v7M2.5 6h7" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" /></svg>
        añadir elemento
      </div>
    </div>
  );
}
