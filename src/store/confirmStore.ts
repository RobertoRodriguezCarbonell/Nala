import { create } from "zustand";

export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Si está, hay que teclear este texto exacto para habilitar Confirmar. */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  busy: boolean;
  confirm: (req: ConfirmRequest) => void;
  cancel: () => void;
  accept: () => Promise<void>;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  busy: false,

  confirm: (request) => set({ request, busy: false }),
  cancel: () => set({ request: null, busy: false }),

  accept: async () => {
    const { request } = get();
    if (!request) return;
    set({ busy: true });
    try {
      await request.onConfirm();
    } finally {
      set({ request: null, busy: false });
    }
  },
}));
