import { PlusIcon } from "../icons";

/**
 * Sidebar izquierda: árbol de servicios. En Fase 1 está vacía (aún no hay
 * servicios dados de alta); en Fase 2 se llena con el árbol del snapshot OpenAPI.
 */
export function Sidebar() {
  return (
    <div
      style={{
        width: 266,
        flex: "none",
        background: "var(--bg-sidebar)",
        borderRight: "0.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 36,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px 0 12px",
          borderBottom: "0.5px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Servicios
        </span>
        <div
          title="Añadir servicio"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <PlusIcon />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-disabled)", textAlign: "center", lineHeight: "17px" }}>
          Aún no hay
          <br />
          servicios dados de alta
        </span>
      </div>

      <div
        style={{
          flex: "none",
          borderTop: "0.5px solid var(--border-subtle)",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-disabled)" }} />
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)" }}>
          0 servicios · 0 endpoints
        </span>
      </div>
    </div>
  );
}
