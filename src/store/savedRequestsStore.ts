import { create } from "zustand";
import {
  createSavedRequest,
  deleteSavedRequest,
  listSavedRequests,
  updateSavedRequest,
} from "../lib/tauri";
import type { SavedRequest, SavedRequestInput } from "../types/saved";

interface SavedRequestsState {
  byService: Record<number, SavedRequest[]>;
  load: (serviceId: number) => Promise<void>;
  create: (input: SavedRequestInput) => Promise<void>;
  update: (id: number, serviceId: number, name: string, isSmoke: boolean, expectedStatus: string) => Promise<void>;
  remove: (id: number, serviceId: number) => Promise<void>;
}

export const useSavedRequestsStore = create<SavedRequestsState>((set, get) => ({
  byService: {},

  load: async (serviceId) => {
    const list = await listSavedRequests(serviceId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: list } }));
  },

  create: async (input) => {
    await createSavedRequest(input);
    await get().load(input.serviceId);
  },

  update: async (id, serviceId, name, isSmoke, expectedStatus) => {
    await updateSavedRequest(id, name, isSmoke, expectedStatus);
    await get().load(serviceId);
  },

  remove: async (id, serviceId) => {
    await deleteSavedRequest(id);
    await get().load(serviceId);
  },
}));
