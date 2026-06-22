import { Reveal } from "@/components/reveal";
import { BorderBeam } from "@/components/magicui/border-beam";

const CLIENT_TS = `export function createClient(config: ClientConfig) {
  return {
    crearReserva: (body: ReservaCreate): Promise<Reserva> =>
      request(config, "POST", \`/reservas\`, { body }),
    getReserva: (params: { id: number }): Promise<Reserva> =>
      request(config, "GET", \`/reservas/\${params.id}\`, {}),
  };
}`;

export function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Del esquema a un cliente tipado</h2>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Nala recorre tu OpenAPI en Rust y emite las interfaces de tus modelos y un cliente{" "}
            <span className="font-mono text-accent">fetch</span> tipado por operación — listo para pegar
            en tu proyecto. Sin <span className="font-mono">openapi-typescript</span> ni dependencias de Node.
          </p>
          <ul className="mt-6 space-y-2 text-fg-muted">
            <li>· Args aplanados y respuesta tipada por su 2xx.</li>
            <li>· Lanza <span className="font-mono text-accent">ApiError</span> en respuestas no-ok.</li>
            <li>· También solo los tipos, si prefieres.</li>
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-xl border border-border-strong bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 font-mono text-xs text-fg-faint">
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" /> cliente.ts
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-fg-muted">{CLIENT_TS}</pre>
            <BorderBeam size={90} duration={8} delay={2} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
