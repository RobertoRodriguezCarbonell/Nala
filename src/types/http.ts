// Tipos del envío HTTP y de las variables (espejo de los structs serde).

export interface Header {
  name: string;
  value: string;
}

export interface HttpRequestInput {
  method: string;
  url: string;
  headers: Header[];
  body?: string | null;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Header[];
  body: string;
  timeMs: number;
  sizeBytes: number;
  contentType?: string;
}

export type VariableScope = "global" | "service" | "environment";

export interface Variable {
  id: number;
  scope: VariableScope;
  scopeId?: number | null;
  key: string;
  value: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariableInput {
  scope: VariableScope;
  scopeId?: number | null;
  key: string;
  value: string;
  isSecret?: boolean;
}
