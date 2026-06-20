import { ResponseViewer } from "../response/ResponseViewer";

/**
 * Panel derecho de respuesta (split vertical lado a lado, estilo Bruno).
 * Aloja el visor de respuesta: status, tiempo, tamaño, headers y body.
 */
export function ResponsePanel() {
  return (
    <div style={{ width: 480, flex: "none", display: "flex", flexDirection: "column", background: "var(--bg-app)", minHeight: 0 }}>
      <ResponseViewer />
    </div>
  );
}
