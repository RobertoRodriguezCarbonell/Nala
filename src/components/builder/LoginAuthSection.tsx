import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import type { AuthStatus, LoginConfig } from "../../types/http";

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

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  padding: "7px 14px",
  borderRadius: "var(--radius-control)",
  border: "none",
  cursor: disabled ? "default" : "pointer",
  background: "var(--accent)",
  color: "var(--bg-app)",
  opacity: disabled ? 0.5 : 1,
});

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

function tokenLine(status: AuthStatus | undefined): { text: string; color: string } {
  switch (status?.tokenState) {
    case "valid": {
      const when = status.expiresAt ? new Date(status.expiresAt * 1000).toLocaleString() : null;
      return { text: when ? `Token válido · caduca ${when}` : "Token válido", color: "var(--accent)" };
    }
    case "expired":
      return { text: "Token caducado", color: "var(--status-5xx)" };
    default:
      return { text: "Sin token", color: "var(--text-faint)" };
  }
}

export function LoginAuthSection({
  serviceId,
  environmentId,
  environmentName,
  status,
}: {
  serviceId: number;
  environmentId: number | null;
  environmentName: string | null;
  status: AuthStatus | undefined;
}) {
  const saveStrategy = useAuthStore((s) => s.saveStrategy);
  const authenticate = useAuthStore((s) => s.authenticate);
  const forgetCredentials = useAuthStore((s) => s.forgetCredentials);

  const cfg = (status?.config ?? {}) as LoginConfig;
  const path = cfg.path ?? "/auth/login";
  const contentType: "form" | "json" = cfg.contentType === "json" ? "json" : "form";
  const userField = cfg.userField ?? "username";
  const passField = cfg.passField ?? "password";
  const tokenPath = cfg.tokenPath ?? "access_token";
  const scheme = cfg.scheme ?? "Bearer";

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveCfg = (patch: Partial<LoginConfig>) => {
    const next: LoginConfig = {
      method: "POST",
      path,
      contentType,
      userField,
      passField,
      tokenPath,
      scheme,
      ...patch,
    };
    void saveStrategy(serviceId, "login", next as Record<string, unknown>, environmentId ?? undefined);
  };

  const cfgInput = (
    value: string,
    onCommit: (v: string) => void,
    placeholder: string
  ): React.ReactElement => (
    <input
      key={value}
      defaultValue={value}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v && v !== value) onCommit(v);
      }}
      placeholder={placeholder}
      style={{ ...inputStyle, flex: 1, minWidth: 0 }}
    />
  );

  const onAuthenticate = async () => {
    if (!environmentId) return;
    setBusy(true);
    setErr(null);
    try {
      await authenticate(serviceId, environmentId, user.trim(), pass, remember);
      setUser("");
      setPass("");
    } catch (e) {
      setErr(typeof e === "string" ? e : String(e));
    } finally {
      setBusy(false);
    }
  };

  const token = tokenLine(status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Config del servicio */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={labelStyle}>LOGIN · TODO EL SERVICIO</div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-faint)", alignSelf: "center" }}>POST</span>
          {cfgInput(path, (v) => saveCfg({ path: v }), "/auth/login")}
          <div style={{ display: "flex", background: "var(--bg-input)", border: "0.5px solid var(--border-control)", borderRadius: "var(--radius-control)", padding: 2 }}>
            {(["form", "json"] as const).map((ct) => (
              <div
                key={ct}
                onClick={() => saveCfg({ contentType: ct })}
                style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "4px 11px", borderRadius: 4, cursor: "pointer", background: contentType === ct ? "var(--bg-raised)" : "transparent", color: contentType === ct ? "var(--text-primary)" : "var(--text-faint)" }}
              >
                {ct}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {cfgInput(userField, (v) => saveCfg({ userField: v }), "campo usuario")}
          {cfgInput(passField, (v) => saveCfg({ passField: v }), "campo clave")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {cfgInput(tokenPath, (v) => saveCfg({ tokenPath: v }), "ruta del token (access_token)")}
          {cfgInput(scheme, (v) => saveCfg({ scheme: v }), "scheme (Bearer)")}
        </div>
      </div>

      {/* Credenciales del entorno */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={labelStyle}>
          CREDENCIALES · {environmentId ? `ENTORNO «${environmentName}»` : "SIN ENTORNO"}
        </div>

        {!environmentId ? (
          <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
            Crea un entorno para autenticarte.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, color: token.color }}>{token.text}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="clave" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <label className="mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Recordar credenciales (cifradas) para reauth automática
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button disabled={busy || user.trim() === "" || pass === ""} onClick={() => void onAuthenticate()} style={primaryBtn(busy || user.trim() === "" || pass === "")}>
                {busy ? "Autenticando…" : "Autenticar"}
              </button>
              {status?.hasCredentials && (
                <>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>•••• credenciales recordadas</span>
                  <button onClick={() => void forgetCredentials(serviceId, environmentId)} style={{ ...textBtn, color: "var(--status-5xx)" }}>Olvidar</button>
                </>
              )}
            </div>
            {err && (
              <div className="mono" style={{ fontSize: 11.5, color: "var(--status-5xx)" }}>{err}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
