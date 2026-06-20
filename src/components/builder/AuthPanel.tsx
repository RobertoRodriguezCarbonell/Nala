import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useServicesStore } from "../../store/servicesStore";
import type { AuthKind } from "../../types/http";

const KINDS: { value: AuthKind; label: string }[] = [
  { value: "none", label: "Ninguna" },
  { value: "bearer", label: "Bearer" },
  { value: "apiKey", label: "API key" },
];

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  color: "var(--text-faint)",
  letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  padding: "7px 10px",
  fontSize: 12,
  color: "var(--text-secondary)",
  outline: "none",
  fontFamily: "var(--font-mono)",
};

const textBtn: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  padding: "4px 8px",
  background: "transparent",
  border: "0.5px solid var(--border-control)",
  borderRadius: "var(--radius-control)",
  color: "var(--text-secondary)",
  cursor: "pointer",
};

export function AuthPanel({ serviceId }: { serviceId: number }) {
  const status = useAuthStore((s) => s.byService[serviceId]);
  const load = useAuthStore((s) => s.load);
  const saveStrategy = useAuthStore((s) => s.saveStrategy);
  const saveSecret = useAuthStore((s) => s.saveSecret);
  const clearSecret = useAuthStore((s) => s.clearSecret);

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
                fontSize: 11.5,
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
            <input
              defaultValue={apiKeyName}
              onBlur={(e) => onApiKey(e.target.value.trim() || "X-API-Key", apiKeyIn)}
              placeholder="Nombre del parámetro"
              style={{ ...inputStyle, flex: 1 }}
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
                    fontSize: 11.5,
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
      {kind !== "none" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={labelStyle}>SECRETO · {env ? `ENTORNO «${env.name}»` : "SIN ENTORNO"}</div>

          {!env ? (
            <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
              Crea un entorno para guardar el secreto.
            </div>
          ) : status?.hasSecret && !editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
                •••• configurado
              </span>
              <button
                onClick={() => {
                  setEditing(true);
                  setSecret("");
                }}
                style={textBtn}
              >
                Reemplazar
              </button>
              <button
                onClick={() => void clearSecret(serviceId, env.id)}
                style={{ ...textBtn, color: "var(--status-5xx)" }}
              >
                Borrar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={kind === "bearer" ? "Pega el token" : "Pega el valor de la API key"}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                disabled={secret.trim() === ""}
                onClick={async () => {
                  await saveSecret(serviceId, env.id, secret.trim());
                  setSecret("");
                  setEditing(false);
                }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  padding: "7px 14px",
                  borderRadius: "var(--radius-control)",
                  border: "none",
                  cursor: secret.trim() === "" ? "default" : "pointer",
                  background: "var(--accent)",
                  color: "var(--bg-app)",
                  opacity: secret.trim() === "" ? 0.5 : 1,
                }}
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mono" style={{ fontSize: 11, color: "var(--text-disabled)", lineHeight: "17px" }}>
        El flujo de login (botón Autenticar, caducidad de token y recordar credenciales) llega en la
        Parte B.
      </div>
    </div>
  );
}
