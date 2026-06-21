// Espejo TS de las peticiones guardadas (serde camelCase).

export interface SavedRequest {
  id: number;
  serviceId: number;
  name: string;
  method: string;
  path: string;
  operationId?: string;
  draftJson: string;
  isSmoke: boolean;
  expectedStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedRequestInput {
  serviceId: number;
  name: string;
  method: string;
  path: string;
  operationId?: string | null;
  draftJson: string;
  isSmoke: boolean;
  expectedStatus: string;
}
