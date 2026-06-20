import { useUiStore } from "../../store/uiStore";
import { ReauthBanner } from "../response/ReauthBanner";
import { ResponseViewer } from "../response/ResponseViewer";

/**
 * Panel derecho de respuesta (split vertical lado a lado, estilo Bruno).
 * Aloja el banner de reauth (cuando hace falta) y el visor de respuesta.
 */
export function ResponsePanel() {
  const responseWidth = useUiStore((s) => s.responseWidth);
  return (
    <div style={{ width: responseWidth, flex: "none", minWidth: 360, display: "flex", flexDirection: "column", background: "var(--bg-app)", minHeight: 0 }}>
      <ReauthBanner />
      <ResponseViewer />
    </div>
  );
}
