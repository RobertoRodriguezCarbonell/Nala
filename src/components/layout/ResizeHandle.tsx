import { useUiStore } from "../../store/uiStore";
import { setSetting } from "../../lib/tauri";

/** Divisor arrastrable entre el panel central y el de respuesta. */
export function ResizeHandle() {
  const responseWidth = useUiStore((s) => s.responseWidth);
  const setResponseWidth = useUiStore((s) => s.setResponseWidth);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = responseWidth;
    // El panel está a la derecha: arrastrar hacia la izquierda lo ensancha.
    const clamp = (w: number) => Math.min(Math.round(window.innerWidth * 0.6), Math.max(360, w));

    const onMove = (ev: MouseEvent) => setResponseWidth(clamp(startW + (startX - ev.clientX)));
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      const w = clamp(startW + (startX - ev.clientX));
      void setSetting("response_width", String(w));
    };

    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      title="Arrastra para redimensionar"
      style={{ width: 5, flex: "none", cursor: "col-resize", background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    />
  );
}
