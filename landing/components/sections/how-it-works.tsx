import { Reveal } from "@/components/reveal";
import { STEPS } from "@/lib/content";

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border bg-raised/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Cómo funciona</h2>
          <p className="mt-4 text-lg text-fg-muted">Tres pasos del primer alta a tener tus APIs bajo control.</p>
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="font-mono text-sm text-accent">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
