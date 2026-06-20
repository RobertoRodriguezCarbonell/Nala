import { useUiStore } from "../../store/uiStore";
import { FolderIcon, PlusIcon } from "../icons";

/**
 * Panel central. En Fase 1, sin servicios, muestra el estado de onboarding
 * (CTA "Añadir servicio"). En fases siguientes alojará el constructor de
 * peticiones con sus pestañas. El pie discreto muestra una prueba viva de que
 * la persistencia (SQLite) y el keychain funcionan entre arranques.
 */
export function CenterPanel() {
  const { launchCount, keyReady, booting } = useUiStore();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-app)",
        borderRight: "0.5px solid var(--border)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 13,
            border: "0.5px solid var(--border-control)",
            background: "var(--bg-input)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FolderIcon />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Da de alta tu primer servicio
          </span>
          <span style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: "19px" }}>
            Pega la URL de una API FastAPI y Nala importará sus endpoints desde el OpenAPI automáticamente.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent)",
            borderRadius: "var(--radius-control)",
            padding: "9px 16px",
            cursor: "pointer",
            color: "var(--bg-app)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <PlusIcon color="var(--bg-app)" />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Añadir servicio</span>
        </div>
      </div>

      {/* Pie de estado del esqueleto — prueba de persistencia + keychain. */}
      <div
        style={{
          flex: "none",
          borderTop: "0.5px solid var(--border-subtle)",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>
          {booting ? "arrancando…" : `apertura nº ${launchCount}`}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>
          sqlite ✓
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: keyReady ? "var(--status-2xx)" : "var(--text-disabled)" }}>
          keychain {keyReady ? "✓" : "—"}
        </span>
      </div>
    </div>
  );
}
