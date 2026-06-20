/** Color semántico por método HTTP (coherente con los tokens del diseño). */
export function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "var(--method-get)";
    case "POST":
      return "var(--method-post)";
    case "PUT":
      return "var(--method-put)";
    case "PATCH":
      return "var(--method-patch)";
    case "DELETE":
      return "var(--method-delete)";
    default:
      return "var(--text-muted)";
  }
}

/** Badge monoespaciado del método, alineado a la derecha (estilo del árbol). */
export function MethodBadge({ method, width = 42 }: { method: string; width?: number }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 9.5,
        fontWeight: 600,
        width,
        flex: "none",
        textAlign: "right",
        color: methodColor(method),
      }}
    >
      {method.toUpperCase()}
    </span>
  );
}
