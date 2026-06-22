import type { CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: { background: "var(--accent)", border: "none", color: "var(--bg-app)", fontWeight: 600 },
  secondary: { background: "transparent", border: "0.5px solid var(--border-control)", color: "var(--text-secondary)", fontWeight: 500 },
  ghost: { background: "transparent", border: "none", color: "var(--text-faint)", fontWeight: 500 },
  danger: { background: "transparent", border: "0.5px solid var(--status-5xx)", color: "var(--status-5xx)", fontWeight: 600 },
};

/** Botón base de la app. El contenido (incl. iconos/spinner) va como children. */
export function Button({
  variant = "secondary",
  onClick,
  disabled = false,
  title,
  type = "button",
  style,
  children,
}: {
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        padding: "7px 14px",
        borderRadius: "var(--radius-control)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
