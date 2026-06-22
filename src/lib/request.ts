// Construcción de la petición HTTP a partir de los inputs de un constructor.
// Se extrae aquí para reutilizarla tanto en el envío normal como en el smoke.

import { interpolate } from "./interpolate";
import type { Row, TabState } from "../store/requestStore";
import type { AuthContext, HttpRequestInput, RequestMeta } from "../types/http";

/** Subconjunto serializable de un TabState: lo que define una petición guardada. */
export interface RequestDraft {
  pathParams: Record<string, string>;
  query: Row[];
  headers: Row[];
  bodyMode: "form" | "json";
  bodyForm: unknown;
  bodyJson: string;
  hasBody: boolean;
}

/** Elimina campos vacíos ('' / null / [] / {}) para no enviar opcionales en blanco. */
export function pruneEmpty(value: unknown): unknown {
  if (Array.isArray(value)) {
    const arr = value.map(pruneEmpty).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const pv = pruneEmpty(v);
      if (pv !== undefined) out[k] = pv;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === "" || value === null) return undefined;
  return value;
}

/** Toma de un TabState el subconjunto que define la petición (para guardarla). */
export function draftFromTab(st: TabState): RequestDraft {
  return {
    pathParams: { ...st.pathParams },
    query: st.query.map((r) => ({ ...r })),
    headers: st.headers.map((r) => ({ ...r })),
    bodyMode: st.bodyMode,
    bodyForm: st.bodyForm,
    bodyJson: st.bodyJson,
    hasBody: st.hasBody,
  };
}

/** Construye la petición HTTP final (URL, query, headers, body) ya interpolada. */
export function buildHttpRequest(args: {
  method: string;
  path: string;
  draft: RequestDraft;
  baseUrl: string;
  varMap: Record<string, string>;
  auth: AuthContext | null;
  meta: RequestMeta;
}): HttpRequestInput {
  const { method, path, draft, baseUrl, varMap, auth, meta } = args;

  const resolvedPath = path.replace(/\{([^}]+)\}/g, (_, n) =>
    encodeURIComponent(interpolate(draft.pathParams[n] ?? "", varMap))
  );
  const qs = draft.query
    .filter((r) => r.enabled && r.name.trim() !== "")
    .map((r) => `${encodeURIComponent(interpolate(r.name, varMap))}=${encodeURIComponent(interpolate(r.value, varMap))}`)
    .join("&");
  const url = `${interpolate(baseUrl, varMap)}${resolvedPath}${qs ? `?${qs}` : ""}`;

  const headers = draft.headers
    .filter((r) => r.enabled && r.name.trim() !== "")
    .map((r) => ({ name: interpolate(r.name, varMap), value: interpolate(r.value, varMap) }));

  let body: string | null = null;
  if (draft.hasBody) {
    body =
      draft.bodyMode === "json"
        ? interpolate(draft.bodyJson, varMap)
        : interpolate(JSON.stringify(pruneEmpty(draft.bodyForm) ?? {}), varMap);
    if (!headers.some((h) => h.name.toLowerCase() === "content-type")) {
      headers.push({ name: "Content-Type", value: "application/json" });
    }
  }

  return { method, url, headers, body, auth, meta };
}

/** ¿El status cumple lo esperado? `2xx`/`3xx`/`4xx`/`5xx` (familia) o código exacto. */
export function matchesExpected(status: number, expected: string): boolean {
  const fam = /^([2-5])xx$/.exec(expected);
  if (fam) return Math.floor(status / 100) === Number(fam[1]);
  const code = Number(expected);
  return Number.isFinite(code) && status === code;
}
