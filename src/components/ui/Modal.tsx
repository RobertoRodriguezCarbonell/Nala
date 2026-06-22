import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Chasis de modal: overlay + tarjeta centrada. Cierra al hacer clic fuera o con
 * Escape (si `dismissable`). El contenido y la lógica viven en quien lo usa.
 */
export function Modal({
  title,
  onClose,
  width = 420,
  footer,
  dismissable = true,
  children,
}: {
  title?: string;
  onClose: () => void;
  width?: number;
  footer?: ReactNode;
  dismissable?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, dismissable]);

  return (
    <div
      onClick={dismissable ? onClose : undefined}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "92vw", maxHeight: "88vh", background: "var(--bg-app)", border: "0.5px solid var(--border-strong)", borderRadius: "var(--radius-window)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {title && (
          <div style={{ flex: "none", padding: "13px 16px", borderBottom: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
          </div>
        )}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: "var(--space-5)", overflow: "auto" }}>
          {children}
        </div>
        {footer && (
          <div style={{ flex: "none", padding: "11px 16px", borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
