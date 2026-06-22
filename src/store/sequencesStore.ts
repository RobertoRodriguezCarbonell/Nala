import { create } from "zustand";
import { createSequence, deleteSequence, listSequences, updateSequence } from "../lib/tauri";
import type { Sequence, SequenceInput } from "../types/sequence";

interface SequencesState {
  byService: Record<number, Sequence[]>;
  load: (serviceId: number) => Promise<void>;
  create: (input: SequenceInput) => Promise<Sequence>;
  update: (id: number, serviceId: number, name: string, stepsJson: string) => Promise<void>;
  remove: (id: number, serviceId: number) => Promise<void>;
}

export const useSequencesStore = create<SequencesState>((set, get) => ({
  byService: {},

  load: async (serviceId) => {
    const list = await listSequences(serviceId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: list } }));
  },

  create: async (input) => {
    const created = await createSequence(input);
    await get().load(input.serviceId);
    return created;
  },

  update: async (id, serviceId, name, stepsJson) => {
    await updateSequence(id, name, stepsJson);
    await get().load(serviceId);
  },

  remove: async (id, serviceId) => {
    await deleteSequence(id);
    await get().load(serviceId);
  },
}));
