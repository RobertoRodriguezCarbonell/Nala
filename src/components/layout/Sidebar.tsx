import { useEffect, useState } from "react";
import { useServicesStore, opKey } from "../../store/servicesStore";
import { useRequestStore } from "../../store/requestStore";
import { useConfirmStore } from "../../store/confirmStore";
import { ChevronIcon, FolderClosedIcon, PlusIcon, RefreshIcon } from "../icons";
import { MethodBadge } from "../MethodBadge";
import type { Operation } from "../../types/openapi";

/**
 * Sidebar: árbol de servicios → endpoints. Servicios como carpetas plegables
 * (agrupadas por proyecto); cada endpoint con su badge de método y ruta.
 */
export function Sidebar() {
  const {
    services,
    specs,
    expanded,
    loadingSpec,
    activeServiceId,
    selectedOpKey,
    openWizard,
    toggleExpand,
    selectService,
    selectOperation,
    refreshActiveService,
    removeService,
  } = useServicesStore();
  const openTab = useRequestStore((s) => s.openTab);

  const confirm = useConfirmStore((s) => s.confirm);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);

  // Cierra el menú kebab al hacer clic fuera o con Escape.
  useEffect(() => {
    if (menuId == null) return;
    const onClick = () => setMenuId(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuId(null); };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); };
  }, [menuId]);

  const totalEndpoints = services.reduce((n, s) => n + (specs[s.id]?.operations.length ?? 0), 0);

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
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Servicios
        </span>
        <div
          title="Añadir servicio"
          onClick={openWizard}
          style={{ width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <PlusIcon />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "4px 0" }}>
        {services.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 20px" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-disabled)", textAlign: "center", lineHeight: "17px" }}>
              Aún no hay
              <br />
              servicios dados de alta
            </span>
          </div>
        ) : (
          services.map((svc) => {
            const isOpen = !!expanded[svc.id];
            const isActive = activeServiceId === svc.id;
            const spec = specs[svc.id];
            const ops = spec?.operations ?? [];
            return (
              <div key={svc.id} style={{ position: "relative" }}>
                <div
                  onClick={() => { selectService(svc.id); toggleExpand(svc.id); }}
                  className="svc-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px 5px 10px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-row-hover)"; setHoverId(svc.id); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; setHoverId(null); }}
                >
                  <span style={{ display: "flex", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .12s" }}>
                    <ChevronIcon />
                  </span>
                  <FolderClosedIcon color={isActive ? "var(--accent)" : "var(--text-faint)"} />
                  <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.name}</span>
                  {loadingSpec[svc.id] ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: 11,
                        height: 11,
                        border: "1.5px solid var(--border)",
                        borderTopColor: "var(--accent)",
                        borderRadius: "50%",
                        animation: "nala-spin 0.7s linear infinite",
                      }}
                    />
                  ) : (
                    <>
                      {isActive && (
                        <span
                          title="Refrescar (nuevo snapshot)"
                          onClick={(e) => { e.stopPropagation(); void refreshActiveService(); }}
                          style={{ marginLeft: "auto", color: "var(--text-faint)", display: "flex" }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.color = "var(--accent)")}
                          onMouseLeave={(ev) => (ev.currentTarget.style.color = "var(--text-faint)")}
                        >
                          <RefreshIcon />
                        </span>
                      )}
                      {hoverId === svc.id || menuId === svc.id ? (
                        <span
                          title="Acciones"
                          onClick={(e) => { e.stopPropagation(); setMenuId(menuId === svc.id ? null : svc.id); }}
                          style={{ marginLeft: isActive ? 8 : "auto", color: "var(--text-faint)", display: "flex", cursor: "pointer" }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.color = "var(--text-primary)")}
                          onMouseLeave={(ev) => (ev.currentTarget.style.color = "var(--text-faint)")}
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="3" r="1.3" />
                            <circle cx="8" cy="8" r="1.3" />
                            <circle cx="8" cy="13" r="1.3" />
                          </svg>
                        </span>
                      ) : (
                        <span className="mono" style={{ fontSize: 10, color: "var(--text-disabled)", marginLeft: isActive ? 8 : "auto" }}>
                          {ops.length}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {menuId === svc.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: "absolute", right: 8, top: 30, zIndex: 50, background: "var(--bg-raised)", border: "0.5px solid var(--border-strong)", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", padding: 4, minWidth: 160 }}
                  >
                    <div
                      onClick={() => {
                        setMenuId(null);
                        confirm({
                          title: "Eliminar servicio",
                          message: `Se borrará «${svc.name}» y, en cascada, sus entornos, snapshots, credenciales e historial. No se puede deshacer.`,
                          confirmLabel: "Eliminar",
                          requireText: svc.name,
                          onConfirm: () => removeService(svc.id),
                        });
                      }}
                      style={{ padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--status-5xx)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Eliminar servicio
                    </div>
                  </div>
                )}

                {isOpen && (
                  <div>
                    {spec === null && !loadingSpec[svc.id] && (
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-disabled)", padding: "5px 12px 5px 30px" }}>
                        sin snapshot — refresca
                      </div>
                    )}
                    {ops.map((op) => (
                      <EndpointRow
                        key={opKey(op)}
                        op={op}
                        selected={isActive && selectedOpKey === opKey(op)}
                        onSelect={() => { selectOperation(svc.id, opKey(op)); openTab(svc.id, op); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ flex: "none", borderTop: "0.5px solid var(--border-subtle)", padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: services.length ? "var(--status-2xx)" : "var(--text-disabled)" }} />
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)" }}>
          {services.length} servicio{services.length === 1 ? "" : "s"} · {totalEndpoints} endpoints
        </span>
      </div>
    </div>
  );
}

function EndpointRow({ op, selected, onSelect }: { op: Operation; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 12px 4px 30px",
        cursor: "pointer",
        background: selected ? "var(--bg-raised)" : "transparent",
        borderLeft: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "var(--bg-row-hover)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <MethodBadge method={op.method} />
      <span
        className="mono"
        title={op.path}
        style={{ fontSize: 11.5, color: selected ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {op.path}
      </span>
    </div>
  );
}
