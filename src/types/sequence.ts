// Espejo TS de las secuencias (serde camelCase) + sus pasos (parseados de stepsJson).

export interface Extraction {
  jsonPath: string;
  varName: string;
}

export interface SequenceStep {
  savedRequestId: number;
  extractions: Extraction[];
}

export interface Sequence {
  id: number;
  serviceId: number;
  name: string;
  stepsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceInput {
  serviceId: number;
  name: string;
  stepsJson: string;
}
