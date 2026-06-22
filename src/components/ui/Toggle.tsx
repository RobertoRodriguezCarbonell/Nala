/** Switch booleano (valor de un campo bool). */
export function Toggle({
  on,
  onToggle,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: on ? "var(--accent)" : "var(--border-control)",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        transition: "background .12s",
        opacity: disabled ? 0.5 : 1,
        flex: "none",
      }}
    >
      <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "var(--bg-app)", transition: "left .12s" }} />
    </div>
  );
}
