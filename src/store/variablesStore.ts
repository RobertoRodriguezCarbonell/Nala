import { create } from "zustand";
import { deleteVariable, listVariables, upsertVariable } from "../lib/tauri";
import type { Variable, VariableInput } from "../types/http";

interface VariablesState {
  variables: Variable[];
  open: boolean;

  openManager: () => void;
  closeManager: () => void;
  load: (serviceId?: number, environmentId?: number) => Promise<void>;
  save: (input: VariableInput, serviceId?: number, environmentId?: number) => Promise<void>;
  remove: (id: number, serviceId?: number, environmentId?: number) => Promise<void>;
}

export const useVariablesStore = create<VariablesState>((set) => ({
  variables: [],
  open: false,

  openManager: () => set({ open: true }),
  closeManager: () => set({ open: false }),

  load: async (serviceId, environmentId) => {
    const variables = await listVariables(serviceId, environmentId);
    set({ variables });
  },

  save: async (input, serviceId, environmentId) => {
    await upsertVariable(input);
    const variables = await listVariables(serviceId, environmentId);
    set({ variables });
  },

  remove: async (id, serviceId, environmentId) => {
    await deleteVariable(id);
    const variables = await listVariables(serviceId, environmentId);
    set({ variables });
  },
}));
