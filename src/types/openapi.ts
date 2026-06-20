// Espejo en TypeScript del modelo normalizado que emite el motor de Rust
// (serde con camelCase). El frontend solo recorre esta estructura; no parsea
// OpenAPI por su cuenta.

export interface NormalizedSpec {
  openapiVersion: string;
  title?: string;
  version?: string;
  operations: Operation[];
}

export interface Operation {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated: boolean;
  parameters?: Param[];
  requestBody?: RequestBody;
  responses?: ResponseDef[];
}

export interface Param {
  name: string;
  /** path | query | header | cookie */
  location: string;
  required: boolean;
  description?: string;
  schema: Schema;
}

export interface RequestBody {
  required: boolean;
  contentType: string;
  schema: Schema;
}

export interface ResponseDef {
  status: string;
  description?: string;
  contentType?: string;
  schema?: Schema;
}

export interface Schema {
  types?: string[];
  format?: string;
  title?: string;
  description?: string;
  refName?: string;
  nullable: boolean;
  circular: boolean;
  enumValues?: unknown[];
  default?: unknown;
  example?: unknown;
  properties?: Property[];
  required?: string[];
  items?: Schema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  anyOf?: Schema[];
}

export interface Property {
  name: string;
  required: boolean;
  schema: Schema;
}
