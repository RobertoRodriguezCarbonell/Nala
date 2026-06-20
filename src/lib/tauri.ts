import { invoke } from "@tauri-apps/api/core";
import type { NormalizedSpec } from "../types/openapi";

/**
 * Capa fina sobre los comandos de Tauri (backend Rust).
 * Toda la persistencia, el acceso al keychain y las peticiones HTTP pasan por
 * aquí; el frontend nunca toca SQLite, el Credential Manager ni la red directamente.
 */

// ---------- Tipos de dominio (espejo de los structs serde) ----------

export interface Service {
  id: number;
  name: string;
  groupName?: string;
  color?: string;
  icon?: string;
  specPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInput {
  name: string;
  groupName?: string | null;
  color?: string | null;
  icon?: string | null;
  specPath: string;
}

export interface Environment {
  id: number;
  serviceId: number;
  name: string;
  baseUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentInput {
  serviceId: number;
  name: string;
  baseUrl: string;
}

export interface SnapshotMeta {
  id: number;
  serviceId: number;
  openapiVersion: string;
  apiTitle?: string;
  apiVersion?: string;
  endpointCount: number;
  fetchedAt: string;
}

export interface ImportResult {
  snapshot: SnapshotMeta;
  spec: NormalizedSpec;
}

// ---------- Settings / keychain ----------

export function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>("get_setting", { key });
}

export function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

export function ensureEncryptionKey(): Promise<boolean> {
  return invoke<boolean>("ensure_encryption_key");
}

// ---------- Servicios ----------

export function createService(input: ServiceInput): Promise<Service> {
  return invoke<Service>("create_service", { input });
}

export function listServices(): Promise<Service[]> {
  return invoke<Service[]>("list_services");
}

export function updateService(id: number, input: ServiceInput): Promise<Service> {
  return invoke<Service>("update_service", { id, input });
}

export function deleteService(id: number): Promise<void> {
  return invoke<void>("delete_service", { id });
}

// ---------- Entornos ----------

export function createEnvironment(input: EnvironmentInput): Promise<Environment> {
  return invoke<Environment>("create_environment", { input });
}

export function listEnvironments(serviceId: number): Promise<Environment[]> {
  return invoke<Environment[]>("list_environments", { serviceId });
}

export function updateEnvironment(id: number, name: string, baseUrl: string): Promise<Environment> {
  return invoke<Environment>("update_environment", { id, name, baseUrl });
}

export function deleteEnvironment(id: number): Promise<void> {
  return invoke<void>("delete_environment", { id });
}

// ---------- OpenAPI / snapshots ----------

export function importService(serviceId: number, environmentId: number): Promise<ImportResult> {
  return invoke<ImportResult>("import_service", { serviceId, environmentId });
}

export function getServiceSpec(serviceId: number): Promise<NormalizedSpec | null> {
  return invoke<NormalizedSpec | null>("get_service_spec", { serviceId });
}

export function listSnapshots(serviceId: number): Promise<SnapshotMeta[]> {
  return invoke<SnapshotMeta[]>("list_snapshots", { serviceId });
}
