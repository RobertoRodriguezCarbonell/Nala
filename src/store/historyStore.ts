import { create } from "zustand";
import { clearHistory, listHistory, sendRequest } from "../lib/tauri";
import type { HistoryEntry } from "../types/http";

const REDACTED = "••••";

/** Quita de la URL los parámetros de query cuyo valor está redactado. */
function stripRedactedQuery(url: string): string {
  const [base, query] = url.split("?");
  if (!query) return url;
  const kept = query.split("&").filter((pair) => pair.split("=")[1] !== REDACTED);
  return kept.length ? `${base}?${kept.join("&")}` : base;
}

interface HistoryState {
  byService: Record<number, HistoryEntry[]>;
  load: (serviceId: number) => Promise<void>;
  clear: (serviceId: number) => Promise<void>;
  resend: (entry: HistoryEntry) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  byService: {},

  load: async (serviceId) => {
    const entries = await listHistory(serviceId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: entries } }));
  },

  clear: async (serviceId) => {
    await clearHistory(serviceId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: [] } }));
  },

  resend: async (entry) => {
    await sendRequest({
      method: entry.method,
      url: stripRedactedQuery(entry.url),
      headers: entry.requestHeaders.filter((h) => h.value !== REDACTED),
      body: entry.requestBody ?? null,
      auth:
        entry.environmentId != null
          ? { serviceId: entry.serviceId, environmentId: entry.environmentId }
          : null,
      meta: { serviceId: entry.serviceId, environmentId: entry.environmentId ?? null },
    });
    await get().load(entry.serviceId);
  },
}));
