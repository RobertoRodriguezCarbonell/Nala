// Tipos del envío HTTP y de las variables (espejo de los structs serde).

export interface Header {
  name: string;
  value: string;
}

export type AuthKind = "none" | "bearer" | "apiKey" | "login";

export type TokenState = "none" | "valid" | "expired";

export interface LoginConfig {
  method?: string;
  path?: string;
  contentType?: "form" | "json";
  userField?: string;
  passField?: string;
  tokenPath?: string;
  scheme?: string;
}

export interface AuthContext {
  serviceId: number;
  environmentId: number;
}

export interface RequestMeta {
  serviceId: number;
  environmentId?: number | null;
}

export interface HistoryEntry {
  id: number;
  serviceId: number;
  environmentId?: number | null;
  method: string;
  url: string;
  requestHeaders: Header[];
  requestBody?: string | null;
  status?: number | null;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  contentType?: string | null;
  responseHeaders: Header[];
  responseBody: string;
  error?: string | null;
  createdAt: string;
}

export interface HttpRequestInput {
  method: string;
  url: string;
  headers: Header[];
  body?: string | null;
  auth?: AuthContext | null;
  meta?: RequestMeta | null;
}

export interface AuthStatus {
  kind: AuthKind;
  config: Record<string, unknown>;
  hasSecret: boolean;
  tokenState: TokenState;
  rememberCredentials: boolean;
  hasCredentials: boolean;
  expiresAt?: number | null;
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
