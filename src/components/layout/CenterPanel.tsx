import { useUiStore } from "../../store/uiStore";
import { useServicesStore } from "../../store/servicesStore";
import { FolderIcon, PlusIcon } from "../icons";
import { methodColor } from "../MethodBadge";

/**
 * Panel central. Sin servicios → onboarding. Con un endpoint seleccionado →
 * ficha de la operación (solo lectura). El constructor de peticiones (formulario,
 * envío, respuesta) llega en la Fase 3.
 */
export function CenterPanel() {
  const { launchCount, keyReady, booting } = useUiStore();
  const { services, specs, activeServiceId, selectedOpKey, openWizard } = useServicesStore();

  const spec = activeServiceId != null ? specs[activeServiceId] : null;
  const op = spec?.operations.find((o) => `${o.method} ${o.path}` === selectedOpKey) ?? null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRight: "0.5px solid var(--border)" }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {services.length === 0 ? (
          <Onboarding onAdd={openWizard} />
        ) : op ? (
          <OperationDetail
            method={op.method}
            path={op.path}
            summary={op.summary}
            description={op.description}
            tags={op.tags ?? []}
            paramCount={op.parameters?.length ?? 0}
            hasBody={!!op.requestBody}
            responseCount={op.responses?.length ?? 0}
            deprecated={op.deprecated}
          />
        ) : (
          <Centered text="Selecciona un endpoint en el árbol" />
        )}
      </div>

      <div style={{ flex: "none", borderTop: "0.5px solid var(--border-subtle)", padding: "7px 12px", display: "flex", alignItems: "center", gap: 14 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>{booting ? "arrancando…" : `apertura nº ${launchCount}`}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>sqlite ✓</span>
        <span className="mono" style={{ fontSize: 10.5, color: keyReady ? "var(--status-2xx)" : "var(--text-disabled)" }}>keychain {keyReady ? "✓" : "—"}</span>
      </div>
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)" }}>{text}</span>
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

function OperationDetail(props: {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  paramCount: number;
  hasBody: boolean;
  responseCount: number;
  deprecated: boolean;
}) {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: methodColor(props.method) }}>{props.method}</span>
        <span className="mono" style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{props.path}</span>
        {props.deprecated && (
          <span className="mono" style={{ fontSize: 10, color: "var(--status-4xx)", border: "0.5px solid var(--method-post-border)", borderRadius: 4, padding: "1px 6px" }}>deprecated</span>
        )}
      </div>

      {props.summary && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{props.summary}</div>}
      {props.description && <div style={{ fontSize: 12.5, color: "var(--text-faint)", lineHeight: "19px" }}>{props.description}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {props.tags.map((t) => (
          <span key={t} className="mono" style={{ fontSize: 10.5, color: "var(--syntax-type)", border: "0.5px solid var(--method-patch-border)", borderRadius: 5, padding: "3px 8px" }}>{t}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 18, borderTop: "0.5px solid var(--border-subtle)", paddingTop: 12 }}>
        <Stat label="Params" value={props.paramCount} />
        <Stat label="Body" value={props.hasBody ? "sí" : "no"} />
        <Stat label="Responses" value={props.responseCount} />
      </div>

      <div className="mono" style={{ fontSize: 11.5, color: "var(--text-disabled)", background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "10px 12px", lineHeight: "18px" }}>
        El constructor de peticiones (formulario desde el esquema, envío y respuesta) llega en la Fase 3.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}
