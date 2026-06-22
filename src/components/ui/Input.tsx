import type { CSSProperties, KeyboardEvent } from "react";

/** Input "cajeado" canónico. Siempre entrega un string; el caller convierte. */
export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  autoFocus = false,
  min,
  max,
  onKeyDown,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "password";
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      min={min}
      max={max}
      onKeyDown={onKeyDown}
      onChange={(e) => onChange(e.target.value)}
      className="mono"
      style={{
        background: "var(--bg-input)",
        border: "0.5px solid var(--border-input)",
        borderRadius: "var(--radius-input)",
        padding: "7px 10px",
        fontSize: "var(--text-sm)",
        color: "var(--text-secondary)",
        outline: "none",
        width: "100%",
        ...style,
      }}
    />
  );
}
