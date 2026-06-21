// Espejo TS del modelo de diff que emite el motor de Rust (serde camelCase).

export interface SnapshotRef {
  id: number;
  apiVersion?: string;
  fetchedAt: string;
  endpointCount: number;
}

export interface Change {
  /** "endpoint" | "param" | "requestBody" | "response" */
  area: string;
  /** "added" | "removed" | "typeChanged" | "requiredAdded" | "requiredRemoved" */
  op: string;
  method: string;
  path: string;
  target?: string;
  location?: string;
  fromType?: string;
  toType?: string;
  breaking: boolean;
  summary: string;
}

export interface SchemaDiff {
  from: SnapshotRef;
  to: SnapshotRef;
  changes: Change[];
  breakingCount: number;
  nonBreakingCount: number;
}
