import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración de Vite afinada para Tauri.
// El puerto fijo 1420 es el que tauri.conf.json espera en `devUrl`.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // No vigilar el backend de Rust desde Vite.
      ignored: ["**/src-tauri/**"],
    },
  },
});
