import { ReauthBanner } from "../response/ReauthBanner";
import { ResponseViewer } from "../response/ResponseViewer";

/**
 * Panel derecho de respuesta (split vertical lado a lado, estilo Bruno).
 * Aloja el banner de reauth (cuando hace falta) y el visor de respuesta.
 */
export function ResponsePanel() {
  return (
    <div style={{ width: 480, flex: "none", display: "flex", flexDirection: "column", background: "var(--bg-app)", minHeight: 0 }}>
      <ReauthBanner />
      <ResponseViewer />
    </div>
  );
}
