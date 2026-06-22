import type { CSSProperties } from "react";

/** Textarea monoespaciada (editor de body JSON crudo). */
export function Textarea({
  value,
  onChange,
  placeholder,
  spellCheck = false,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      spellCheck={spellCheck}
      onChange={(e) => onChange(e.target.value)}
      className="mono"
      style={{
        width: "100%",
        background: "var(--bg-app)",
        border: "none",
        outline: "none",
        color: "var(--text-secondary)",
        fontSize: "var(--text-sm)",
        lineHeight: "19px",
        padding: "10px 12px",
        resize: "vertical",
        ...style,
      }}
    />
  );
}
