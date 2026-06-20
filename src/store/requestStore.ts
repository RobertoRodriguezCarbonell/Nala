import { create } from "zustand";
import { listVariables, sendRequest } from "../lib/tauri";
import { buildVarMap, interpolate } from "../lib/interpolate";
import { defaultForSchema, preferRawJson } from "../lib/schema";
import type { Operation } from "../types/openapi";
import type { HttpResponse } from "../types/http";
import { useServicesStore } from "./servicesStore";

export interface Row {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
}

export type BuilderTab = "params" | "body" | "headers" | "auth";

interface TabState {
  pathParams: Record<string, string>;
  query: Row[];
  headers: Row[];
  builderTab: BuilderTab;
  bodyMode: "form" | "json";
  bodyForm: unknown;
  bodyJson: string;
  hasBody: boolean;
  requiredBody: string[];
  responseTab: "body" | "headers";
  sending: boolean;
  response: HttpResponse | null;
  error: string | null;
}

export interface OpenTab {
  id: string;
  serviceId: number;
  method: string;
  path: string;
}

let rowSeq = 0;
const newRow = (name = "", value = "", enabled = true): Row => ({
  id: `r${rowSeq++}`,
  name,
  value,
  enabled,
});

const pathParamNames = (path: string): string[] =>
  [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

/** Elimina campos vacíos ('' / null / [] / {}) para no enviar opcionales en blanco. */
function pruneEmpty(value: unknown): unknown {
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

function initTab(op: Operation): TabState {
  const query = (op.parameters ?? [])
    .filter((p) => p.location === "query")
    .map((p) => newRow(p.name, "", p.required));
  const headers = (op.parameters ?? [])
    .filter((p) => p.location === "header")
    .map((p) => newRow(p.name, "", p.required));

  const pathParams: Record<string, string> = {};
  pathParamNames(op.path).forEach((n) => (pathParams[n] = ""));

  const hasBody = !!op.requestBody;
  const bodyForm = hasBody ? defaultForSchema(op.requestBody!.schema) : undefined;
  const requiredBody = hasBody ? op.requestBody!.schema.required ?? [] : [];
  const bodyMode = hasBody && preferRawJson(op.requestBody!.schema) ? "json" : "form";

  return {
    pathParams,
    query,
    headers,
    builderTab: "params",
    bodyMode,
    bodyForm,
    bodyJson: hasBody ? JSON.stringify(bodyForm, null, 2) : "",
    hasBody,
    requiredBody,
    responseTab: "body",
    sending: false,
    response: null,
    error: null,
  };
}

interface RequestState {
  tabs: OpenTab[];
  tabStates: Record<string, TabState>;
  activeTabId: string | null;

  openTab: (serviceId: number, op: Operation) => void;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  patch: (id: string, partial: Partial<TabState>) => void;
  setBodyMode: (id: string, mode: "form" | "json") => void;
  send: (id: string) => Promise<void>;
}

const tabId = (serviceId: number, op: Operation) => `${serviceId}:${op.method} ${op.path}`;

export const useRequestStore = create<RequestState>((set, get) => ({
  tabs: [],
  tabStates: {},
  activeTabId: null,

  openTab: (serviceId, op) => {
    const id = tabId(serviceId, op);
    const { tabs, tabStates } = get();
    if (tabStates[id]) {
      set({ activeTabId: id });
      return;
    }
    set({
      tabs: [...tabs, { id, serviceId, method: op.method, path: op.path }],
      tabStates: { ...tabStates, [id]: initTab(op) },
      activeTabId: id,
    });
  },

  closeTab: (id) => {
    const { tabs, tabStates, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    const nextTabs = tabs.filter((t) => t.id !== id);
    const nextStates = { ...tabStates };
    delete nextStates[id];
    let nextActive = activeTabId;
    if (activeTabId === id) {
      const fallback = nextTabs[idx] ?? nextTabs[idx - 1] ?? null;
      nextActive = fallback?.id ?? null;
    }
    set({ tabs: nextTabs, tabStates: nextStates, activeTabId: nextActive });
  },

  selectTab: (id) => set({ activeTabId: id }),

  patch: (id, partial) =>
    set((s) => {
      const cur = s.tabStates[id];
      if (!cur) return {};
      return { tabStates: { ...s.tabStates, [id]: { ...cur, ...partial } } };
    }),

  setBodyMode: (id, mode) => {
    const st = get().tabStates[id];
    if (!st) return;
    if (mode === st.bodyMode) return;
    if (mode === "json") {
      // Form → JSON: serializa el valor actual.
      get().patch(id, { bodyMode: "json", bodyJson: JSON.stringify(st.bodyForm ?? {}, null, 2) });
    } else {
      // JSON → Form: intenta parsear; si falla, conserva el form previo.
      try {
        const parsed = JSON.parse(st.bodyJson || "{}");
        get().patch(id, { bodyMode: "form", bodyForm: parsed });
      } catch {
        get().patch(id, { bodyMode: "form" });
      }
    }
  },

  send: async (id) => {
    const { tabs, tabStates, patch } = get();
    const tab = tabs.find((t) => t.id === id);
    const st = tabStates[id];
    if (!tab || !st) return;

    const svc = useServicesStore.getState();
    const envs = svc.environments[tab.serviceId] ?? [];
    const env = envs.find((e) => e.id === svc.activeEnvironmentId) ?? envs[0] ?? null;
    const baseUrl = env?.baseUrl ?? "";

    const variables = await listVariables(tab.serviceId, env?.id);
    const map = buildVarMap(variables, tab.serviceId, env?.id ?? null, baseUrl);

    // Validación mínima: path params y required de body (modo form).
    const missing: string[] = [];
    for (const [name, raw] of Object.entries(st.pathParams)) {
      if (interpolate(raw, map).trim() === "") missing.push(`path: ${name}`);
    }
    if (st.hasBody && st.bodyMode === "form") {
      const form = (st.bodyForm ?? {}) as Record<string, unknown>;
      for (const req of st.requiredBody) {
        const v = form[req];
        if (v === undefined || v === "" || v === null) missing.push(`body: ${req}`);
      }
    }
    if (missing.length) {
      patch(id, { error: `Faltan campos obligatorios → ${missing.join(", ")}`, response: null });
      return;
    }

    // URL: sustituye path params, interpola, añade query string.
    const path = tab.path.replace(/\{([^}]+)\}/g, (_, n) =>
      encodeURIComponent(interpolate(st.pathParams[n] ?? "", map))
    );
    const qs = st.query
      .filter((r) => r.enabled && r.name.trim() !== "")
      .map((r) => `${encodeURIComponent(interpolate(r.name, map))}=${encodeURIComponent(interpolate(r.value, map))}`)
      .join("&");
    const url = `${interpolate(baseUrl, map)}${path}${qs ? `?${qs}` : ""}`;

    const headers = st.headers
      .filter((r) => r.enabled && r.name.trim() !== "")
      .map((r) => ({ name: interpolate(r.name, map), value: interpolate(r.value, map) }));

    let body: string | null = null;
    if (st.hasBody) {
      body =
        st.bodyMode === "json"
          ? interpolate(st.bodyJson, map)
          : interpolate(JSON.stringify(pruneEmpty(st.bodyForm) ?? {}), map);
      if (!headers.some((h) => h.name.toLowerCase() === "content-type")) {
        headers.push({ name: "Content-Type", value: "application/json" });
      }
    }

    patch(id, { sending: true, error: null });
    try {
      const response = await sendRequest({ method: tab.method, url, headers, body });
      patch(id, { sending: false, response, responseTab: "body" });
    } catch (err) {
      patch(id, { sending: false, error: typeof err === "string" ? err : String(err) });
    }
  },
}));

export { newRow };
