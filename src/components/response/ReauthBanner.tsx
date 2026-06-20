import { useState } from "react";
import { useRequestStore } from "../../store/requestStore";
import { useAuthStore } from "../../store/authStore";
import { useServicesStore } from "../../store/servicesStore";

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  padding: "5px 8px",
  fontSize: 11.5,
  color: "var(--text-secondary)",
  outline: "none",
  fontFamily: "var(--font-mono)",
  width: 110,
};

export function ReauthBanner() {
  const activeTabId = useRequestStore((s) => s.activeTabId);
  const tabs = useRequestStore((s) => s.tabs);
  const tabStates = useRequestStore((s) => s.tabStates);
  const send = useRequestStore((s) => s.send);

  const byService = useAuthStore((s) => s.byService);
  const reauthenticate = useAuthStore((s) => s.reauthenticate);
  const authenticate = useAuthStore((s) => s.authenticate);

  const environments = useServicesStore((s) => s.environments);
  const activeEnvId = useServicesStore((s) => s.activeEnvironmentId);

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;
  const needed = activeTabId ? tabStates[activeTabId]?.reauthNeeded : false;
  if (!tab || !activeTabId || !needed) return null;

  const envs = environments[tab.serviceId] ?? [];
  const env = envs.find((e) => e.id === activeEnvId) ?? envs[0] ?? null;
  if (!env) return null;

  const remembered = !!byService[tab.serviceId]?.hasCredentials;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await action();
      await send(activeTabId); // reintenta la petición una vez
    } catch (e) {
      setErr(typeof e === "string" ? e : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderBottom: "0.5px solid var(--border-subtle)", background: "rgba(210,153,34,0.08)" }}>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--status-4xx)" }}>
        Sesión caducada (401){remembered ? " · credenciales recordadas" : ""}
      </span>
      {remembered ? (
        <button disabled={busy} onClick={() => void run(() => reauthenticate(tab.serviceId, env.id))} style={{ alignSelf: "flex-start", fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "6px 13px", borderRadius: "var(--radius-control)", border: "none", cursor: busy ? "default" : "pointer", background: "var(--accent)", color: "var(--bg-app)", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Reautenticando…" : "Reautenticar"}
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario" style={inputStyle} />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="clave" style={inputStyle} />
          <button disabled={busy || user.trim() === "" || pass === ""} onClick={() => void run(() => authenticate(tab.serviceId, env.id, user.trim(), pass, false))} style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "6px 13px", borderRadius: "var(--radius-control)", border: "none", cursor: busy || user.trim() === "" || pass === "" ? "default" : "pointer", background: "var(--accent)", color: "var(--bg-app)", opacity: busy || user.trim() === "" || pass === "" ? 0.5 : 1 }}>
            Autenticar
          </button>
        </div>
      )}
      {err && <span className="mono" style={{ fontSize: 11, color: "var(--status-5xx)" }}>{err}</span>}
    </div>
  );
}
