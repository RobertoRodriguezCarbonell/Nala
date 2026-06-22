import { useState } from "react";
import { useRequestStore } from "../../store/requestStore";
import { useAuthStore } from "../../store/authStore";
import { useServicesStore } from "../../store/servicesStore";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

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
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => void run(() => reauthenticate(tab.serviceId, env.id))}
          style={{ alignSelf: "flex-start", padding: "6px 13px" }}
        >
          {busy ? "Reautenticando…" : "Reautenticar"}
        </Button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Input value={user} onChange={setUser} placeholder="usuario" style={{ width: 110 }} />
          <Input type="password" value={pass} onChange={setPass} placeholder="clave" style={{ width: 110 }} />
          <Button
            variant="primary"
            disabled={busy || user.trim() === "" || pass === ""}
            onClick={() => void run(() => authenticate(tab.serviceId, env.id, user.trim(), pass, false))}
            style={{ padding: "6px 13px" }}
          >
            Autenticar
          </Button>
        </div>
      )}
      {err && <span className="mono" style={{ fontSize: 11, color: "var(--status-5xx)" }}>{err}</span>}
    </div>
  );
}
