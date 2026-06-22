import type { ReactNode } from "react";

/** Etiqueta encima del control (label + hint opcional). Para modales/auth/variables. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{label}</span>
      {children}
      {hint && <span className="mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-disabled)" }}>{hint}</span>}
    </label>
  );
}
