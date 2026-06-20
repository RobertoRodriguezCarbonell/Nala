import { create } from "zustand";
import {
  authenticate as authenticateCmd,
  clearEnvironmentSecret,
  forgetCredentials as forgetCredentialsCmd,
  getAuth,
  reauthenticate as reauthenticateCmd,
  setAuthStrategy,
  setEnvironmentSecret,
} from "../lib/tauri";
import type { AuthKind, AuthStatus } from "../types/http";

interface AuthState {
  byService: Record<number, AuthStatus>;
  load: (serviceId: number, environmentId?: number) => Promise<void>;
  saveStrategy: (
    serviceId: number,
    kind: AuthKind,
    config: Record<string, unknown>,
    environmentId?: number
  ) => Promise<void>;
  saveSecret: (serviceId: number, environmentId: number, value: string) => Promise<void>;
  clearSecret: (serviceId: number, environmentId: number) => Promise<void>;
  authenticate: (
    serviceId: number,
    environmentId: number,
    user: string,
    pass: string,
    remember: boolean
  ) => Promise<void>;
  reauthenticate: (serviceId: number, environmentId: number) => Promise<void>;
  forgetCredentials: (serviceId: number, environmentId: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  byService: {},

  load: async (serviceId, environmentId) => {
    const status = await getAuth(serviceId, environmentId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: status } }));
  },

  saveStrategy: async (serviceId, kind, config, environmentId) => {
    await setAuthStrategy(serviceId, kind, config);
    await get().load(serviceId, environmentId);
  },

  saveSecret: async (serviceId, environmentId, value) => {
    await setEnvironmentSecret(environmentId, value);
    await get().load(serviceId, environmentId);
  },

  clearSecret: async (serviceId, environmentId) => {
    await clearEnvironmentSecret(environmentId);
    await get().load(serviceId, environmentId);
  },

  authenticate: async (serviceId, environmentId, user, pass, remember) => {
    const status = await authenticateCmd(serviceId, environmentId, user, pass, remember);
    set((s) => ({ byService: { ...s.byService, [serviceId]: status } }));
  },

  reauthenticate: async (serviceId, environmentId) => {
    const status = await reauthenticateCmd(serviceId, environmentId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: status } }));
  },

  forgetCredentials: async (serviceId, environmentId) => {
    const status = await forgetCredentialsCmd(serviceId, environmentId);
    set((s) => ({ byService: { ...s.byService, [serviceId]: status } }));
  },
}));
