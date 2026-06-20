import type { Variable } from "../types/http";

/**
 * Construye el mapa de variables resuelto por precedencia de ámbito
 * (entorno > servicio > global). `baseUrl` se inyecta como variable implícita
 * del entorno activo.
 */
export function buildVarMap(
  variables: Variable[],
  serviceId: number | null,
  environmentId: number | null,
  baseUrl: string | null
): Record<string, string> {
  const map: Record<string, string> = {};
  const order = { global: 0, service: 1, environment: 2 } as const;

  // Orden ascendente de precedencia: el ámbito más específico sobrescribe.
  [...variables]
    .filter(
      (v) =>
        v.scope === "global" ||
        (v.scope === "service" && v.scopeId === serviceId) ||
        (v.scope === "environment" && v.scopeId === environmentId)
    )
    .sort((a, b) => order[a.scope] - order[b.scope])
    .forEach((v) => {
      map[v.key] = v.value;
    });

  if (baseUrl != null) map.baseUrl = baseUrl;
  return map;
}

/** Sustituye `{{var}}` usando el mapa. Las no resueltas se dejan tal cual. */
export function interpolate(input: string, map: Record<string, string>): string {
  return input.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) =>
    key in map ? map[key] : `{{${key}}}`
  );
}

/** Devuelve los nombres de variable usados en una cadena (sin duplicados). */
export function usedVars(input: string): string[] {
  const out = new Set<string>();
  for (const m of input.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) out.add(m[1]);
  return [...out];
}
