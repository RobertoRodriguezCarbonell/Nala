import type { Schema } from "../types/openapi";

/** Tipo principal del esquema (primer tipo no nulo; deduce object/array). */
export function primaryType(s: Schema): string {
  const t = (s.types ?? []).find((x) => x !== "null");
  if (t) return t;
  if (s.properties && s.properties.length) return "object";
  if (s.items) return "array";
  return "string";
}

/** Valor inicial razonable para un esquema (controla los inputs del formulario). */
export function defaultForSchema(s: Schema): unknown {
  if (s.default !== undefined && s.default !== null) return s.default;
  switch (primaryType(s)) {
    case "object": {
      const o: Record<string, unknown> = {};
      (s.properties ?? []).forEach((p) => (o[p.name] = defaultForSchema(p.schema)));
      return o;
    }
    case "array":
      return [];
    case "boolean":
      return false;
    default:
      return "";
  }
}

/** Etiqueta corta del tipo para mostrar bajo el nombre del campo. */
export function typeHint(s: Schema): string {
  const t = primaryType(s);
  const opt = s.nullable ? " · nullable" : "";
  if (s.enumValues && s.enumValues.length) return `enum · ${s.enumValues.length} valores${opt}`;
  if (t === "array") {
    const it = s.items ? primaryType(s.items) : "any";
    return `array<${it}>${opt}`;
  }
  if (t === "object") return `object${s.refName ? ` · ${s.refName}` : ""}${opt}`;
  if (s.format) return `${t} · ${s.format}${opt}`;
  if (t === "integer" || t === "number") {
    const parts: string[] = [];
    if (s.minimum != null) parts.push(`≥${s.minimum}`);
    if (s.maximum != null) parts.push(`≤${s.maximum}`);
    return `${t}${parts.length ? ` · ${parts.join(" ")}` : ""}${opt}`;
  }
  return `${t}${opt}`;
}

/** Esquemas que conviene editar como JSON crudo (circulares o sin forma clara). */
export function preferRawJson(s: Schema): boolean {
  return s.circular === true;
}
