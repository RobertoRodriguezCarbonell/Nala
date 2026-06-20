import { useState } from "react";
import { useServicesStore } from "../../store/servicesStore";

type Step = "form" | "importing" | "done" | "error";

const field: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  padding: "8px 10px",
  fontFamily: "var(--font-mono)",
  fontSize: 12.5,
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
};

const label: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 500,
  marginBottom: 5,
  display: "block",
};

function Labeled({ children, text, hint }: { children: React.ReactNode; text: string; hint?: string }) {
  return (
    <div>
      <label style={label}>
        {text}
        {hint && <span style={{ color: "var(--text-disabled)", fontWeight: 400 }}> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function AddServiceWizard() {
  const closeWizard = useServicesStore((s) => s.closeWizard);
  const addServiceWithImport = useServicesStore((s) => s.addServiceWithImport);

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string>("");
  const [count, setCount] = useState(0);

  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [specPath, setSpecPath] = useState("/openapi.json");
  const [envName, setEnvName] = useState("local");
  const [baseUrl, setBaseUrl] = useState("");

  const canSubmit = name.trim() !== "" && baseUrl.trim() !== "" && envName.trim() !== "";

  async function submit() {
    if (!canSubmit) return;
    setStep("importing");
    setError("");
    try {
      const { endpointCount } = await addServiceWithImport(
        {
          name: name.trim(),
          groupName: group.trim() || null,
          specPath: specPath.trim() || "/openapi.json",
        },
        { name: envName.trim(), baseUrl: baseUrl.trim() }
      );
      setCount(endpointCount);
      setStep("done");
    } catch (err) {
      setError(typeof err === "string" ? err : String(err));
      setStep("error");
    }
  }

  return (
    <div
      onClick={step === "form" ? closeWizard : undefined}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          background: "var(--bg-app)",
          border: "0.5px solid var(--border-strong)",
          borderRadius: "var(--radius-window)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "13px 16px",
            borderBottom: "0.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Añadir servicio</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-disabled)" }}>
            importa desde OpenAPI
          </span>
        </div>

        <div style={{ padding: 16 }}>
          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Labeled text="Nombre del servicio">
                <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Calclon API" autoFocus />
              </Labeled>
              <Labeled text="Grupo / proyecto" hint="opcional">
                <input style={field} value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Backends internos" />
              </Labeled>
              <Labeled text="Ruta del spec">
                <input style={field} value={specPath} onChange={(e) => setSpecPath(e.target.value)} />
              </Labeled>
              <div style={{ height: 0.5, background: "var(--border-subtle)", margin: "2px 0" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 130 }}>
                  <Labeled text="Primer entorno">
                    <input style={field} value={envName} onChange={(e) => setEnvName(e.target.value)} />
                  </Labeled>
                </div>
                <div style={{ flex: 1 }}>
                  <Labeled text="Base URL">
                    <input style={field} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:8000" />
                  </Labeled>
                </div>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "nala-spin 0.7s linear infinite",
                }}
              />
              <span className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>
                importando spec y leyendo endpoints…
              </span>
            </div>
          )}

          {step === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "22px 0" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  border: "0.5px solid var(--method-get-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5l4 4 8-9" stroke="var(--status-2xx)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {count} endpoint{count === 1 ? "" : "s"} detectado{count === 1 ? "" : "s"}
              </span>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", textAlign: "center" }}>
                {name} está listo. Ya puedes verlos en el árbol.
              </span>
            </div>
          )}

          {step === "error" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--status-5xx)" }}>No se pudo importar</span>
              <div
                className="mono"
                style={{
                  fontSize: 11.5,
                  color: "var(--text-secondary)",
                  background: "var(--bg-input)",
                  border: "0.5px solid var(--border-input)",
                  borderRadius: "var(--radius-input)",
                  padding: "9px 11px",
                  lineHeight: "17px",
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "11px 16px",
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {step === "form" && (
            <>
              <Button onClick={closeWizard} variant="ghost">Cancelar</Button>
              <Button onClick={submit} variant="primary" disabled={!canSubmit}>Importar</Button>
            </>
          )}
          {step === "importing" && <Button onClick={() => {}} variant="ghost" disabled>Importando…</Button>}
          {step === "done" && <Button onClick={closeWizard} variant="primary">Ver endpoints</Button>}
          {step === "error" && (
            <>
              <Button onClick={closeWizard} variant="ghost">Cerrar</Button>
              <Button onClick={() => setStep("form")} variant="primary">Volver</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "ghost";
  disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        padding: "7px 14px",
        borderRadius: "var(--radius-control)",
        border: primary ? "none" : "0.5px solid var(--border-control)",
        background: primary ? "var(--accent)" : "transparent",
        color: primary ? "var(--bg-app)" : "var(--text-secondary)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}
