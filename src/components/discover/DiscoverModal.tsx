import { useEffect, useState } from "react";
import { useServicesStore } from "../../store/servicesStore";
import { discoverLocalhost } from "../../lib/tauri";
import type { Discovered } from "../../types/discover";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

/** Modal que sondea localhost y ofrece dar de alta los servicios encontrados. */
export function DiscoverModal() {
  const closeDiscover = useServicesStore((s) => s.closeDiscover);
  const openWizard = useServicesStore((s) => s.openWizard);

  const [scanning, setScanning] = useState(true);
  const [found, setFound] = useState<Discovered[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scan = () => {
    setScanning(true);
    setError(null);
    setFound([]);
    discoverLocalhost()
      .then((list) => {
        setFound(list);
        setScanning(false);
      })
      .catch((e) => {
        setError(String(e));
        setScanning(false);
      });
  };

  useEffect(() => {
    scan();
  }, []);

  const onAdd = (d: Discovered) => {
    openWizard({ name: d.title ?? "", baseUrl: d.baseUrl, specPath: d.specPath });
    closeDiscover();
  };

  return (
    <Modal title="Descubrir servicios locales" onClose={closeDiscover} width={460}>
      {scanning ? (
        <EmptyState text="escaneando puertos comunes…" spinner />
      ) : error ? (
        <EmptyState text={error} />
      ) : found.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-5)", padding: "var(--space-6)" }}>
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-disabled)", textAlign: "center" }}>
            No se encontraron servicios en los puertos comunes.
          </span>
          <Button variant="secondary" onClick={scan}>Volver a escanear</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {found.map((d) => (
            <div key={d.port} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "0.5px solid var(--border-row)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title ?? d.baseUrl}
                </div>
                <div className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.baseUrl}{d.version ? ` · v${d.version}` : ""} · {d.endpointCount} endpoints
                </div>
              </div>
              <Button variant="primary" onClick={() => onAdd(d)}>Añadir</Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
