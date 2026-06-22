import { getCurrentWindow } from "@tauri-apps/api/window";
import { Logo } from "../Logo";

/**
 * Titlebar personalizado (la ventana usa `decorations: false`).
 * Zona arrastrable + isotipo Nala + controles de ventana nativos.
 */
const appWindow = getCurrentWindow();

function ControlButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 30,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-faint)",
        cursor: "pointer",
        borderRadius: 4,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </div>
  );
}

export function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      style={{
        height: 34,
        flex: "none",
        background: "var(--bg-titlebar)",
        borderBottom: "0.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px 0 12px",
      }}
    >
      <div data-tauri-drag-region style={{ display: "flex", alignItems: "center", gap: 9, pointerEvents: "none" }}>
        <Logo size={14} />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontWeight: 500 }}>Nala</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <ControlButton onClick={() => appWindow.minimize()}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </ControlButton>
        <ControlButton onClick={() => appWindow.toggleMaximize()}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="2.5" y="2.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </ControlButton>
        <ControlButton onClick={() => appWindow.close()}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
}
