import { useEffect, useState } from "react";
import { useConfirmStore } from "../../store/confirmStore";

export function ConfirmModal() {
  const request = useConfirmStore((s) => s.request);
  const busy = useConfirmStore((s) => s.busy);
  const cancel = useConfirmStore((s) => s.cancel);
  const accept = useConfirmStore((s) => s.accept);

  const [text, setText] = useState("");

  // Resetea el input cada vez que cambia la petición.
  useEffect(() => {
    setText("");
  }, [request]);

  // Escape cancela.
  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, cancel]);

  if (!request) return null;

  const needsText = request.requireText != null;
  const matched = !needsText || text === request.requireText;
  const disabled = busy || !matched;

  return (
    <div
      onClick={cancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--bg-app)", border: "0.5px solid var(--border-strong)", borderRadius: "var(--radius-window)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "13px 16px", borderBottom: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{request.title}</span>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {request.message && (
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: "19px" }}>{request.message}</span>
          )}
          {needsText && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                Escribe «{request.requireText}» para confirmar
              </span>
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && matched && !busy) void accept(); }}
                style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-primary)", outline: "none", width: "100%" }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "11px 16px", borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={cancel}
            disabled={busy}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 14px", borderRadius: "var(--radius-control)", border: "0.5px solid var(--border-control)", background: "transparent", color: "var(--text-secondary)", cursor: busy ? "default" : "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void accept()}
            disabled={disabled}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 14px", borderRadius: "var(--radius-control)", border: "none", background: "var(--status-5xx)", color: "#fff", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}
          >
            {busy ? "…" : request.confirmLabel ?? "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
