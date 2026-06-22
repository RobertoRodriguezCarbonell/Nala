import { buildHttpRequest, matchesExpected } from "./request";
import type { RequestDraft } from "./request";
import { extractPath, toVarString } from "./jsonpath";
import { sendRequest } from "./tauri";
import type { Environment } from "./tauri";
import type { SequenceStep } from "../types/sequence";
import type { SavedRequest } from "../types/saved";

export interface StepResult {
  name: string;
  method: string;
  path: string;
  status?: number;
  ok: boolean;
  error?: string;
  extracted: Record<string, string>;
}

/**
 * Ejecuta una secuencia en orden, encadenando variables extraídas (efímeras) de
 * cada respuesta. Para en el primer paso no-2xx o con error de red. No escribe en
 * el historial (skipHistory).
 */
export async function runSequence(args: {
  serviceId: number;
  steps: SequenceStep[];
  savedRequests: SavedRequest[];
  env: Environment;
  baseVarMap: Record<string, string>;
}): Promise<StepResult[]> {
  const { serviceId, steps, savedRequests, env, baseVarMap } = args;
  const runVars: Record<string, string> = {};
  const results: StepResult[] = [];

  for (const step of steps) {
    const saved = savedRequests.find((r) => r.id === step.savedRequestId);
    if (!saved) {
      results.push({ name: "(petición no encontrada)", method: "", path: "", ok: false, error: "petición no encontrada", extracted: {} });
      break;
    }

    const result: StepResult = { name: saved.name, method: saved.method, path: saved.path, ok: false, extracted: {} };
    try {
      const draft = JSON.parse(saved.draftJson) as RequestDraft;
      const input = buildHttpRequest({
        method: saved.method,
        path: saved.path,
        draft,
        baseUrl: env.baseUrl,
        varMap: { ...baseVarMap, ...runVars },
        auth: { serviceId, environmentId: env.id },
        meta: { serviceId, environmentId: env.id, skipHistory: true },
      });
      const res = await sendRequest(input);
      result.status = res.status;
      result.ok = matchesExpected(res.status, "2xx");

      if (result.ok && step.extractions.length > 0) {
        let body: unknown;
        try {
          body = JSON.parse(res.body);
        } catch {
          body = undefined;
        }
        for (const ex of step.extractions) {
          if (!ex.varName.trim()) continue;
          const val = toVarString(extractPath(body, ex.jsonPath));
          if (val !== undefined) {
            runVars[ex.varName] = val;
            result.extracted[ex.varName] = val;
          }
        }
      }
    } catch (e) {
      result.error = typeof e === "string" ? e : String(e);
    }

    results.push(result);
    if (!result.ok) break;
  }

  return results;
}
