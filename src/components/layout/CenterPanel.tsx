import { useUiStore } from "../../store/uiStore";
import { useServicesStore } from "../../store/servicesStore";
import { useRequestStore } from "../../store/requestStore";
import { RequestTabs } from "../builder/RequestTabs";
import { RequestBuilder } from "../builder/RequestBuilder";
import { ServiceTabBar } from "./ServiceTabBar";
import { HistoryTab } from "../history/HistoryTab";
import { TypesTab } from "../types/TypesTab";
import { DiffTab } from "../diff/DiffTab";
import { SmokeTab } from "../smoke/SmokeTab";
import { SequencesTab } from "../sequences/SequencesTab";
import { FolderIcon, PlusIcon } from "../icons";

/**
 * Panel central. Sin servicios → onboarding. Con servicios → barra de pestañas
 * de servicio + endpoints o historial según la vista activa.
 */
export function CenterPanel() {
  const launchCount = useUiStore((s) => s.launchCount);
  const keyReady = useUiStore((s) => s.keyReady);
  const booting = useUiStore((s) => s.booting);
  const serviceView = useUiStore((s) => s.serviceView);
  const { services, openWizard } = useServicesStore();
  const openDiscover = useServicesStore((s) => s.openDiscover);
  const activeServiceId = useRequestStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.serviceId ?? null;
  });

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRight: "0.5px solid var(--border)" }}>
      {services.length === 0 ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Onboarding onAdd={() => openWizard()} onDiscover={openDiscover} />
        </div>
      ) : (
        <>
          <ServiceTabBar />
          {serviceView === "history" ? (
            activeServiceId != null ? (
              <HistoryTab serviceId={activeServiceId} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>Abre un endpoint para ver el historial de su servicio.</span>
              </div>
            )
          ) : serviceView === "types" ? (
            activeServiceId != null ? (
              <TypesTab serviceId={activeServiceId} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>Abre un endpoint para generar los tipos de su servicio.</span>
              </div>
            )
          ) : serviceView === "diff" ? (
            activeServiceId != null ? (
              <DiffTab serviceId={activeServiceId} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>Abre un endpoint para comparar los snapshots de su servicio.</span>
              </div>
            )
          ) : serviceView === "smoke" ? (
            activeServiceId != null ? (
              <SmokeTab serviceId={activeServiceId} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>Abre un endpoint del servicio para ver y ejecutar su smoke.</span>
              </div>
            )
          ) : serviceView === "sequences" ? (
            activeServiceId != null ? (
              <SequencesTab serviceId={activeServiceId} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)" }}>Abre un endpoint para ver las secuencias de su servicio.</span>
              </div>
            )
          ) : (
            <>
              <RequestTabs />
              <RequestBuilder />
            </>
          )}
        </>
      )}

      <div style={{ flex: "none", borderTop: "0.5px solid var(--border-subtle)", padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-disabled)" }}>{booting ? "arrancando…" : `apertura nº ${launchCount}`}</span>
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--border)" }}>·</span>
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-disabled)" }}>sqlite ✓</span>
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--border)" }}>·</span>
        <span className="mono" style={{ fontSize: "var(--text-micro)", color: keyReady ? "var(--status-2xx)" : "var(--text-disabled)" }}>keychain {keyReady ? "✓" : "—"}</span>
      </div>
    </div>
  );
}

function Onboarding({ onAdd, onDiscover }: { onAdd: () => void; onDiscover: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 32, textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 13, border: "0.5px solid var(--border-control)", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FolderIcon />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>Da de alta tu primer servicio</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)", lineHeight: "19px" }}>
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
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Añadir servicio</span>
      </div>
      <span
        onClick={onDiscover}
        className="mono"
        style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", cursor: "pointer", marginTop: 4 }}
      >
        o descubrir servicios locales
      </span>
    </div>
  );
}
