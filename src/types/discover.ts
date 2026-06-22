// Espejo TS de un servicio descubierto en localhost (serde camelCase).
export interface Discovered {
  port: number;
  baseUrl: string;
  specPath: string;
  title?: string;
  version?: string;
  endpointCount: number;
}
