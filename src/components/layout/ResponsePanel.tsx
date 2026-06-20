/**
 * Panel derecho de respuesta (split vertical lado a lado, estilo Bruno).
 * En Fase 1 está vacío: sin peticiones todavía. En Fase 3 mostrará status,
 * tiempo, tamaño, headers y el visor JSON.
 */
export function ResponsePanel() {
  return (
    <div
      style={{
        width: 480,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-app)",
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 36,
          flex: "none",
          display: "flex",
          alignItems: "center",
          padding: "0 13px",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
          Respuesta
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>
          Lanza una petición para ver la respuesta
        </span>
      </div>
    </div>
  );
}
