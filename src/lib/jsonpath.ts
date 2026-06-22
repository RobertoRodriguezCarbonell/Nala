// Subconjunto de JSONPath: `$` inicial opcional, segmentos por punto, índices [n].
// Cubre rutas tipo `access_token`, `$.token`, `data[0].id`, `items[2]`.

export function extractPath(value: unknown, path: string): unknown {
  const norm = path.trim().replace(/^\$\.?/, "");
  if (norm === "") return value;

  const tokens: (string | number)[] = [];
  for (const seg of norm.split(".")) {
    if (seg === "") continue;
    const m = seg.match(/^([^[\]]*)((?:\[\d+\])*)$/);
    if (!m) return undefined;
    if (m[1]) tokens.push(m[1]);
    const idxs = m[2].match(/\[(\d+)\]/g);
    if (idxs) for (const ix of idxs) tokens.push(Number(ix.slice(1, -1)));
  }

  let cur: unknown = value;
  for (const t of tokens) {
    if (cur == null) return undefined;
    if (typeof t === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[t];
    } else {
      if (typeof cur !== "object" || Array.isArray(cur)) return undefined;
      cur = (cur as Record<string, unknown>)[t];
    }
  }
  return cur;
}

/** Convierte un valor extraído a string para el mapa de variables. */
export function toVarString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
