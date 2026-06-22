import { CardTitle, CardText } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { MagicCard } from "@/components/magicui/magic-card";
import { FEATURES } from "@/lib/content";

export function Features() {
  return (
    <section id="caracteristicas" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Todo lo que necesitas para tus APIs</h2>
        <p className="mt-4 text-lg text-fg-muted">Del alta de un servicio a generar su cliente tipado y automatizar pruebas, sin salir de Nala.</p>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.06} className="h-full">
            <MagicCard className="h-full">
              <div className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-raised text-accent">
                  <f.icon size={18} />
                </div>
                <CardTitle className="mt-4">{f.title}</CardTitle>
                <CardText>{f.text}</CardText>
              </div>
            </MagicCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
