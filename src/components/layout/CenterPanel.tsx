import { useUiStore } from "../../store/uiStore";
import { useServicesStore } from "../../store/servicesStore";
import { RequestTabs } from "../builder/RequestTabs";
import { RequestBuilder } from "../builder/RequestBuilder";
import { FolderIcon, PlusIcon } from "../icons";

/**
 * Panel central. Sin servicios → onboarding. Con servicios → pestañas de
 * peticiones abiertas + constructor (formulario desde el esquema, envío).
 */
export function CenterPanel() {
  const { launchCount, keyReady, booting } = useUiStore();
  const { services, openWizard } = useServicesStore();

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRight: "0.5px solid var(--border)" }}>
      {services.length === 0 ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Onboarding onAdd={openWizard} />
        </div>
      ) : (
        <>
          <RequestTabs />
          <RequestBuilder />
        </>
      )}

      <div style={{ flex: "none", borderTop: "0.5px solid var(--border-subtle)", padding: "7px 12px", display: "flex", alignItems: "center", gap: 14 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>{booting ? "arrancando…" : `apertura nº ${launchCount}`}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>sqlite ✓</span>
        <span className="mono" style={{ fontSize: 10.5, color: keyReady ? "var(--status-2xx)" : "var(--text-disabled)" }}>keychain {keyReady ? "✓" : "—"}</span>
      </div>
    </div>
  );
}

function Onboarding({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 32, textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 13, border: "0.5px solid var(--border-control)", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FolderIcon />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Da de alta tu primer servicio</span>
        <span style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: "19px" }}>
          Pega la URL de una API FastAPI y Nala importará sus endpoints desde el OpenAPI automáticamente.
        </span>
      </div>
      <div
        onClick={onAdd}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent)", borderRadius: "var(--radius-control)", padding: "9px 16px", cursor: "pointer", color: "var(--bg-app)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
      >
        <PlusIcon color="var(--bg-app)" />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Añadir servicio</span>
      </div>
    </div>
  );
}
