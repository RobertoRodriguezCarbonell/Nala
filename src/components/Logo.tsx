import logoUrl from "../../assets/nala-logo.svg";

/** Isotipo de Nala (maltés blanco sobre índigo). Tamaño en px. */
export function Logo({ size = 16 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="Nala"
      style={{ display: "block", borderRadius: Math.round(size * 0.22) }}
      draggable={false}
    />
  );
}
