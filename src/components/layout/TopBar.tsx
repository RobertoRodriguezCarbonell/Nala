import { useUiStore } from "../../store/uiStore";
import { LockIcon, SearchIcon, SettingsIcon } from "../icons";

/**
 * Barra superior: selector de servicio + entorno activo, buscador global,
 * e indicadores de estado. En Fase 1 no hay servicios → estado "Sin servicio".
 */
export function TopBar() {
  const keyReady = useUiStore((s) => s.keyReady);

  return (
    <div
      style={{
        height: 46,
        flex: "none",
        background: "var(--bg-app)",
        borderBottom: "0.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 12px",
      }}
    >
      {/* Selector de servicio · entorno (vacío en Fase 1) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-input)",
          border: "0.5px dashed var(--border-control)",
          borderRadius: "var(--radius-control)",
          padding: "6px 11px",
          opacity: 0.7,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-disabled)" }} />
        <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin servicio</span>
      </div>

      {/* Buscador global */}
      <div
        style={{
          flex: 1,
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "var(--bg-input)",
          border: "0.5px solid var(--border-input)",
          borderRadius: "var(--radius-control)",
          padding: "6px 11px",
          opacity: 0.6,
        }}
      >
        <SearchIcon />
        <span style={{ fontSize: 12.5, color: "var(--text-faint)", flex: 1 }}>
          Buscar endpoints, rutas, modelos…
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            border: "0.5px solid var(--border-control)",
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          Ctrl K
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Indicador de clave de cifrado lista (keychain) */}
      <div
        title={keyReady ? "Clave de cifrado lista en Credential Manager" : "Clave de cifrado no disponible"}
        style={{ display: "flex", alignItems: "center", gap: 6, opacity: keyReady ? 1 : 0.4 }}
      >
        <LockIcon color={keyReady ? "var(--status-2xx)" : "var(--text-faint)"} />
      </div>

      {/* Ajustes */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--radius-control)",
          border: "0.5px solid var(--border-input)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <SettingsIcon />
      </div>
    </div>
  );
}
