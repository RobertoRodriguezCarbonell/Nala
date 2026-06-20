import { invoke } from "@tauri-apps/api/core";

/**
 * Capa fina sobre los comandos de Tauri (backend Rust).
 * Toda la persistencia y el acceso al keychain pasan por aquí; el frontend
 * nunca toca SQLite ni el Credential Manager directamente.
 */

/** Lee un valor de la tabla `settings`. Devuelve null si no existe. */
export function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>("get_setting", { key });
}

/** Escribe (upsert) un valor en la tabla `settings`. */
export function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

/**
 * Asegura que la clave de cifrado de campos existe en el Credential Manager
 * de Windows (la crea en el primer arranque). Devuelve true si está lista.
 * Nunca expone la clave en sí.
 */
export function ensureEncryptionKey(): Promise<boolean> {
  return invoke<boolean>("ensure_encryption_key");
}
