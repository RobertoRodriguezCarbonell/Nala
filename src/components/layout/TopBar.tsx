import { useState } from "react";
import { useUiStore } from "../../store/uiStore";
import { useServicesStore } from "../../store/servicesStore";
import { useVariablesStore } from "../../store/variablesStore";
import { ChevronIcon, LockIcon, SearchIcon, SettingsIcon } from "../icons";

/**
 * Barra superior: selector de servicio + entorno activo, buscador global e
 * indicadores de estado. Con servicios dados de alta, el selector se puebla.
 */
export function TopBar() {
  const keyReady = useUiStore((s) => s.keyReady);
  const { services, environments, activeServiceId, activeEnvironmentId, setActiveEnvironment } = useServicesStore();
  const openVariables = useVariablesStore((s) => s.openManager);

  const [envMenu, setEnvMenu] = useState(false);

  const service = services.find((s) => s.id === activeServiceId) ?? null;
  const envs = activeServiceId != null ? environments[activeServiceId] ?? [] : [];
  const env = envs.find((e) => e.id === activeEnvironmentId) ?? null;

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
      {service ? (
        <div style={{ position: "relative" }}>
          <div
            onClick={() => envs.length > 0 && setEnvMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-raised)",
              border: "0.5px solid var(--border-control)",
              borderRadius: "var(--radius-control)",
              padding: "6px 11px",
              cursor: envs.length > 0 ? "pointer" : "default",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--status-2xx)", boxShadow: "0 0 0 2px var(--method-get-border)" }} />
            <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{service.name}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>·</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--method-post)" }}>{env?.name ?? "—"}</span>
            <ChevronIcon />
          </div>

          {envMenu && envs.length > 0 && (
            <>
              <div onClick={() => setEnvMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  left: 0,
                  minWidth: 180,
                  background: "var(--bg-titlebar)",
                  border: "0.5px solid var(--border-strong)",
                  borderRadius: "var(--radius-control)",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
                  padding: 4,
                  zIndex: 41,
                }}
              >
                {envs.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => { setActiveEnvironment(e.id); setEnvMenu(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "6px 8px",
                      borderRadius: 4,
                      cursor: "pointer",
                      background: e.id === activeEnvironmentId ? "var(--bg-raised)" : "transparent",
                    }}
                    onMouseEnter={(ev) => { if (e.id !== activeEnvironmentId) ev.currentTarget.style.background = "var(--bg-row-hover)"; }}
                    onMouseLeave={(ev) => { if (e.id !== activeEnvironmentId) ev.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.name}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                      {e.baseUrl}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "0.5px dashed var(--border-control)", borderRadius: "var(--radius-control)", padding: "6px 11px", opacity: 0.7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-disabled)" }} />
          <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin servicio</span>
        </div>
      )}

      <div style={{ flex: 1, maxWidth: 520, display: "flex", alignItems: "center", gap: 9, background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-control)", padding: "6px 11px", opacity: 0.6 }}>
        <SearchIcon />
        <span style={{ fontSize: 12.5, color: "var(--text-faint)", flex: 1 }}>Buscar endpoints, rutas, modelos…</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", border: "0.5px solid var(--border-control)", borderRadius: 4, padding: "1px 5px" }}>Ctrl K</span>
      </div>

      <div style={{ flex: 1 }} />

      <div
        title="Variables"
        onClick={openVariables}
        className="mono"
        style={{ height: 28, padding: "0 9px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-input)", display: "flex", alignItems: "center", fontSize: 11.5, color: "var(--text-muted)", cursor: "pointer" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--accent-var)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        {"{{ }}"}
      </div>

      <div title={keyReady ? "Clave de cifrado lista en Credential Manager" : "Clave de cifrado no disponible"} style={{ display: "flex", alignItems: "center", gap: 6, opacity: keyReady ? 1 : 0.4 }}>
        <LockIcon color={keyReady ? "var(--status-2xx)" : "var(--text-faint)"} />
      </div>

      <div
        style={{ width: 28, height: 28, borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-input)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <SettingsIcon />
      </div>
    </div>
  );
}
