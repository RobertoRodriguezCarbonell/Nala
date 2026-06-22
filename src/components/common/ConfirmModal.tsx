import { useEffect, useState } from "react";
import { useConfirmStore } from "../../store/confirmStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

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

  if (!request) return null;

  const needsText = request.requireText != null;
  const matched = !needsText || text === request.requireText;
  const disabled = busy || !matched;

  return (
    <Modal
      title={request.title}
      onClose={cancel}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={cancel} disabled={busy}>Cancelar</Button>
          <Button variant="danger" onClick={() => void accept()} disabled={disabled}>
            {busy ? "…" : request.confirmLabel ?? "Eliminar"}
          </Button>
        </>
      }
    >
      {request.message && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "19px" }}>{request.message}</span>
      )}
      {needsText && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
            Escribe «{request.requireText}» para confirmar
          </span>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && matched && !busy) void accept(); }}
            style={{ background: "var(--bg-input)", border: "0.5px solid var(--border-input)", borderRadius: "var(--radius-input)", padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-primary)", outline: "none", width: "100%" }}
          />
        </div>
      )}
    </Modal>
  );
}
