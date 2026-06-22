import type { CSSProperties, ReactNode } from "react";

/** Select "cajeado" compacto. Estilo de formulario amplio vía `style` override. */
export function Select({
  value,
  onChange,
  disabled = false,
  style,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mono"
      style={{
        background: "var(--bg-input)",
        border: "0.5px solid var(--border-control)",
        borderRadius: "var(--radius-control)",
        padding: "4px 6px",
        fontSize: "var(--text-xs)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </select>
  );
}
