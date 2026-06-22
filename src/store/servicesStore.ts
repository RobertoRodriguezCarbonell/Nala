import { create } from "zustand";
import {
  createEnvironment,
  createService,
  deleteService,
  getServiceSpec,
  importService,
  listEnvironments,
  listServices,
  type Environment,
  type EnvironmentInput,
  type Service,
  type ServiceInput,
} from "../lib/tauri";
import type { NormalizedSpec, Operation } from "../types/openapi";

/** Clave estable para identificar una operación dentro de un servicio. */
export function opKey(op: Operation): string {
  return `${op.method} ${op.path}`;
}

/** Valores con los que prefijar el wizard al abrirlo desde el descubrimiento. */
export interface WizardInitial {
  name?: string;
  baseUrl?: string;
  specPath?: string;
}

interface ServicesState {
  services: Service[];
  environments: Record<number, Environment[]>;
  specs: Record<number, NormalizedSpec | null>;
  expanded: Record<number, boolean>;
  loadingSpec: Record<number, boolean>;

  activeServiceId: number | null;
  activeEnvironmentId: number | null;
  selectedOpKey: string | null;

  wizardOpen: boolean;
  wizardInitial: WizardInitial | null;
  discoverOpen: boolean;

  /** Carga inicial: servicios + entornos + último spec de cada uno. */
  init: () => Promise<void>;

  openWizard: (initial?: WizardInitial) => void;
  closeWizard: () => void;
  openDiscover: () => void;
  closeDiscover: () => void;

  toggleExpand: (serviceId: number) => void;
  selectService: (serviceId: number) => void;
  setActiveEnvironment: (environmentId: number) => void;
  selectOperation: (serviceId: number, key: string) => void;

  /** Alta de servicio + primer entorno + importación del spec. */
  addServiceWithImport: (
    service: ServiceInput,
    environment: Omit<EnvironmentInput, "serviceId">
  ) => Promise<{ endpointCount: number }>;

  /** Refresca el servicio activo contra su entorno activo (nuevo snapshot). */
  refreshActiveService: () => Promise<void>;

  removeService: (serviceId: number) => Promise<void>;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  environments: {},
  specs: {},
  expanded: {},
  loadingSpec: {},
  activeServiceId: null,
  activeEnvironmentId: null,
  selectedOpKey: null,
  wizardOpen: false,
  wizardInitial: null,
  discoverOpen: false,

  init: async () => {
    const services = await listServices();
    const environments: Record<number, Environment[]> = {};
    const specs: Record<number, NormalizedSpec | null> = {};

    await Promise.all(
      services.map(async (svc) => {
        environments[svc.id] = await listEnvironments(svc.id);
        specs[svc.id] = await getServiceSpec(svc.id);
      })
    );

    const first = services[0];
    set({
      services,
      environments,
      specs,
      activeServiceId: first?.id ?? null,
      activeEnvironmentId: first ? environments[first.id]?.[0]?.id ?? null : null,
      expanded: first ? { [first.id]: true } : {},
    });
  },

  openWizard: (initial) => set({ wizardOpen: true, wizardInitial: initial ?? null }),
  closeWizard: () => set({ wizardOpen: false, wizardInitial: null }),
  openDiscover: () => set({ discoverOpen: true }),
  closeDiscover: () => set({ discoverOpen: false }),

  toggleExpand: (serviceId) =>
    set((s) => ({ expanded: { ...s.expanded, [serviceId]: !s.expanded[serviceId] } })),

  selectService: (serviceId) => {
    // Solo marca activo el servicio (y su primer entorno). El plegado lo gestiona
    // `toggleExpand` por separado, para no pelearse con él en el mismo clic.
    const { environments } = get();
    set({
      activeServiceId: serviceId,
      activeEnvironmentId: environments[serviceId]?.[0]?.id ?? null,
    });
  },

  setActiveEnvironment: (environmentId) => set({ activeEnvironmentId: environmentId }),

  selectOperation: (serviceId, key) =>
    set({ activeServiceId: serviceId, selectedOpKey: key }),

  addServiceWithImport: async (service, environment) => {
    const created = await createService(service);
    const env = await createEnvironment({ ...environment, serviceId: created.id });
    const result = await importService(created.id, env.id);

    set((s) => ({
      services: [...s.services, created],
      environments: { ...s.environments, [created.id]: [env] },
      specs: { ...s.specs, [created.id]: result.spec },
      expanded: { ...s.expanded, [created.id]: true },
      activeServiceId: created.id,
      activeEnvironmentId: env.id,
    }));

    return { endpointCount: result.snapshot.endpointCount };
  },

  refreshActiveService: async () => {
    const { activeServiceId, activeEnvironmentId } = get();
    if (activeServiceId == null || activeEnvironmentId == null) return;

    set((s) => ({ loadingSpec: { ...s.loadingSpec, [activeServiceId]: true } }));
    try {
      const result = await importService(activeServiceId, activeEnvironmentId);
      set((s) => ({ specs: { ...s.specs, [activeServiceId]: result.spec } }));
    } finally {
      set((s) => ({ loadingSpec: { ...s.loadingSpec, [activeServiceId]: false } }));
    }
  },

  removeService: async (serviceId) => {
    await deleteService(serviceId);
    set((s) => {
      const services = s.services.filter((x) => x.id !== serviceId);
      const next = services[0] ?? null;
      return {
        services,
        activeServiceId: s.activeServiceId === serviceId ? next?.id ?? null : s.activeServiceId,
        activeEnvironmentId:
          s.activeServiceId === serviceId
            ? next
              ? s.environments[next.id]?.[0]?.id ?? null
              : null
            : s.activeEnvironmentId,
        selectedOpKey: s.activeServiceId === serviceId ? null : s.selectedOpKey,
      };
    });
  },
}));
