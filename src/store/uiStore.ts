import { create } from "zustand";
import { ensureEncryptionKey, getSetting, setSetting } from "../lib/tauri";

/**
 * Estado de UI de Nala. En la Fase 1 (esqueleto) el store solo mantiene
 * estado de arranque y demuestra el ciclo de persistencia contra SQLite y la
 * integración con el keychain. El dominio (servicios, entornos, peticiones)
 * llega en fases posteriores.
 */
interface UiState {
  /** Estado de inicialización del backend. */
  booting: boolean;
  /** La clave de cifrado está disponible en el Credential Manager. */
  keyReady: boolean;
  /** Nº de aperturas de la app (persistido en SQLite). Prueba de persistencia. */
  launchCount: number;
  /** Vista activa del panel central a nivel de servicio. */
  serviceView: "endpoints" | "history";
  setServiceView: (v: "endpoints" | "history") => void;

  /** Arranca la app: carga estado persistido y prepara el keychain. */
  boot: () => Promise<void>;
}

export const useUiStore = create<UiState>((set) => ({
  booting: true,
  keyReady: false,
  launchCount: 0,
  serviceView: "endpoints",
  setServiceView: (serviceView) => set({ serviceView }),

  boot: async () => {
    // 1) Asegura la clave de cifrado en el keychain del SO.
    let keyReady = false;
    try {
      keyReady = await ensureEncryptionKey();
    } catch (err) {
      console.error("No se pudo preparar la clave de cifrado:", err);
    }

    // 2) Carga + incrementa el contador de aperturas (round-trip a SQLite).
    let launchCount = 0;
    try {
      const stored = await getSetting("launch_count");
      launchCount = stored ? parseInt(stored, 10) || 0 : 0;
      launchCount += 1;
      await setSetting("launch_count", String(launchCount));
    } catch (err) {
      console.error("No se pudo leer/guardar el estado en SQLite:", err);
    }

    set({ booting: false, keyReady, launchCount });
  },
}));
