/** Iconos outline finos, coherentes con la estética devtool del diseño. */
import type { CSSProperties } from "react";

type IconProps = { size?: number; color?: string; style?: CSSProperties };

export function SearchIcon({ size = 13, color = "var(--text-faint)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.2" stroke={color} strokeWidth="1.2" />
      <path d="M9.2 9.2L12 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 13, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 2.5v9M2.5 7h9" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon({ size = 10, color = "var(--text-faint)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsIcon({ size = 14, color = "var(--text-faint)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.8v2M8 12.2v2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M1.8 8h2M12.2 8h2M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke={color}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FolderIcon({ size = 28, color = "var(--accent)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M3 8.5c0-1.1.9-2 2-2h6l2.2 2.2H23c1.1 0 2 .9 2 2v9.8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8.5Z"
        stroke={color}
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function LockIcon({ size = 12, color = "var(--status-2xx)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="2.6" y="6" width="8.8" height="6.4" rx="1.4" stroke={color} strokeWidth="1.1" />
      <path d="M4.4 6V4.4a2.6 2.6 0 0 1 5.2 0V6" stroke={color} strokeWidth="1.1" />
    </svg>
  );
}
