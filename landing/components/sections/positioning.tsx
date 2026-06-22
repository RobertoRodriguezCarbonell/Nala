import { Reveal } from "@/components/reveal";

export function Positioning() {
  return (
    <section className="border-y border-border bg-raised/30">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <Reveal>
          <p className="text-pretty text-xl leading-relaxed text-fg-muted md:text-2xl">
            Tienes varios backends FastAPI y vives saltando entre Swagger, curl y Postman.{" "}
            <span className="text-fg">Nala los reúne en un árbol, los importa solos desde su{" "}
            <span className="font-mono text-accent">/openapi.json</span> y te avisa cuando algo cambia</span>{" "}
            — sin cloud, sin cuentas, sin salir de tu máquina.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
