import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useServicesStore } from "../../store/servicesStore";
import { useConfirmStore } from "../../store/confirmStore";
import type { AuthKind } from "../../types/http";
import { LoginAuthSection } from "./LoginAuthSection";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const KINDS: { value: AuthKind; label: string }[] = [
  { value: "none", label: "Ninguna" },
  { value: "bearer", label: "Bearer" },
  { value: "apiKey", label: "API key" },
  { value: "login", label: "Login" },
];

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-micro)",
  color: "var(--text-faint)",
  letterSpacing: "0.5px",
};

export function AuthPanel({ serviceId }: { serviceId: number }) {
  const status = useAuthStore((s) => s.byService[serviceId]);
  const load = useAuthStore((s) => s.load);
  const saveStrategy = useAuthStore((s) => s.saveStrategy);
  const saveSecret = useAuthStore((s) => s.saveSecret);
  const clearSecret = useAuthStore((s) => s.clearSecret);
  const confirm = useConfirmStore((s) => s.confirm);

  // Selecciona el mapa estable y deriva en render (evita devolver un array
  // nuevo desde el selector, que en zustand v5 dispara avisos de getSnapshot).
  const environments = useServicesStore((s) => s.environments);
  const activeEnvId = useServicesStore((s) => s.activeEnvironmentId);
  const envs = environments[serviceId] ?? [];
  const env = envs.find((e) => e.id === activeEnvId) ?? envs[0] ?? null;

  const [secret, setSecret] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void load(serviceId, env?.id);
    setEditing(false);
    setSecret("");
  }, [serviceId, env?.id, load]);

  const kind: AuthKind = status?.kind ?? "none";
  const config = (status?.config ?? {}) as { name?: string; in?: "header" | "query" };
  const apiKeyName = config.name ?? "X-API-Key";
  const apiKeyIn: "header" | "query" = config.in === "query" ? "query" : "header";

  const onKind = (next: AuthKind) => {
    const nextConfig = next === "apiKey" ? { name: apiKeyName, in: apiKeyIn } : {};
    void saveStrategy(serviceId, next, nextConfig, env?.id);
  };

  const onApiKey = (name: string, location: "header" | "query") => {
    void saveStrategy(serviceId, "apiKey", { name, in: location }, env?.id);
  };

  return (
    <div style={{ padding: "14px 14px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Estrategia (servicio) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={labelStyle}>ESTRATEGIA · TODO EL SERVICIO</div>
        <div style={{ display: "flex", gap: 6 }}>
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => onKind(k.value)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                padding: "5px 12px",
                borderRadius: "var(--radius-control)",
                cursor: "pointer",
                border: "0.5px solid var(--border-control)",
                background: kind === k.value ? "var(--accent)" : "var(--bg-input)",
                color: kind === k.value ? "var(--bg-app)" : "var(--text-secondary)",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        {kind === "apiKey" && (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {/* Input no controlado: confirma el nombre al perder el foco */}
            <input
              key={apiKeyName}
              defaultValue={apiKeyName}
              onBlur={(e) => onApiKey(e.target.value.trim() || "X-API-Key", apiKeyIn)}
              placeholder="Nombre del parámetro"
              className="mono"
              style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "7px 10px", fontSize: "var(--text-sm)", color: "var(--text-secondary)", outline: "none", flex: 1 }}
            />
            <div
              style={{
                display: "flex",
                background: "var(--bg-input)",
                border: "0.5px solid var(--border-control)",
                borderRadius: "var(--radius-control)",
                padding: 2,
              }}
            >
              {(["header", "query"] as const).map((loc) => (
                <div
                  key={loc}
                  onClick={() => onApiKey(apiKeyName, loc)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    padding: "4px 11px",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: apiKeyIn === loc ? "var(--bg-raised)" : "transparent",
                    color: apiKeyIn === loc ? "var(--text-primary)" : "var(--text-faint)",
                  }}
                >
                  {loc}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secreto (entorno activo) */}
      {kind !== "none" && kind !== "login" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={labelStyle}>SECRETO · {env ? `ENTORNO «${env.name}»` : "SIN ENTORNO"}</div>

          {!env ? (
            <div className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
              Crea un entorno para guardar el secreto.
            </div>
          ) : status?.hasSecret && !editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: "var(--text-sm)", color: "var(--accent)" }}>
                •••• configurado
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(true);
                  setSecret("");
                }}
                style={{ padding: "4px 8px" }}
              >
                Reemplazar
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  confirm({
                    title: "Borrar secreto",
                    message: "Se borrará el secreto guardado de este entorno.",
                    confirmLabel: "Borrar",
                    onConfirm: () => clearSecret(serviceId, env.id),
                  })
                }
                style={{ padding: "4px 8px" }}
              >
                Borrar
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                type="password"
                value={secret}
                onChange={setSecret}
                placeholder={kind === "bearer" ? "Pega el token" : "Pega el valor de la API key"}
                style={{ flex: 1 }}
              />
              <Button
                variant="primary"
                disabled={secret.trim() === ""}
                onClick={async () => {
                  await saveSecret(serviceId, env.id, secret.trim());
                  setSecret("");
                  setEditing(false);
                }}
              >
                Guardar
              </Button>
            </div>
          )}
        </div>
      )}

      {kind === "login" && (
        <LoginAuthSection
          serviceId={serviceId}
          environmentId={env?.id ?? null}
          environmentName={env?.name ?? null}
          status={status}
        />
      )}

      <div className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)", lineHeight: "17px" }}>
        La estrategia aplica a todo el servicio; el secreto/credenciales son por entorno y se guardan cifrados.
      </div>
    </div>
  );
}
