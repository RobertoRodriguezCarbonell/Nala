import { MethodBadge } from "@/components/method-badge";

const ENDPOINTS = [
  { m: "GET", p: "/reservas" },
  { m: "POST", p: "/reservas" },
  { m: "GET", p: "/reservas/{id}" },
  { m: "POST", p: "/auth/login" },
];

/** Mockup estilizado de la UI de Nala (no es captura). Decorativo. */
export function AppMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-strong bg-bg shadow-2xl shadow-black/50">
      {/* Titlebar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-delete/80" />
        <span className="h-3 w-3 rounded-full bg-post/80" />
        <span className="h-3 w-3 rounded-full bg-get/80" />
        <span className="ml-2 font-mono text-xs text-fg-faint">Nala</span>
      </div>

      <div className="grid grid-cols-[180px_1fr_200px] text-xs">
        {/* Sidebar */}
        <div className="border-r border-border bg-raised/40 p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-fg-faint">Servicios</div>
          <div className="mb-1 flex items-center gap-1.5 text-fg-muted">
            <span>▾</span><span className="font-medium">Mesero API</span>
          </div>
          <ul className="space-y-1.5 pl-3">
            {ENDPOINTS.map((e) => (
              <li key={e.m + e.p} className="flex items-center gap-2">
                <MethodBadge method={e.m} />
                <span className="truncate font-mono text-[11px] text-fg-muted">{e.p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Centro: constructor */}
        <div className="border-r border-border p-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2">
            <MethodBadge method="GET" className="text-[11px]" />
            <span className="font-mono text-[11px] text-fg-muted">
              <span className="text-accent">{`{{`}</span>baseUrl<span className="text-accent">{`}}`}</span>/reservas
            </span>
          </div>
          <div className="mt-3 flex gap-4 border-b border-border pb-2 font-mono text-[11px]">
            <span className="border-b-2 border-accent pb-1 text-fg">Params</span>
            <span className="text-fg-faint">Body</span>
            <span className="text-fg-faint">Headers</span>
            <span className="text-fg-faint">Auth</span>
          </div>
          <div className="mt-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-fg-muted">estado</span><span className="text-fg-faint">confirmada</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">limit</span><span className="text-fg-faint">20</span></div>
          </div>
        </div>

        {/* Derecha: respuesta */}
        <div className="p-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-get" />
            <span className="font-semibold text-get">200 OK</span>
            <span className="text-fg-faint">18 ms</span>
            <span className="text-fg-faint">2.4 KB</span>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-fg-muted">{`[
  {
    "id": 1,
    "cliente": "Ada",
    "estado": "confirmada"
  }
]`}</pre>
        </div>
      </div>
    </div>
  );
}
