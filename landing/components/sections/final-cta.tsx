import { Download, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { LINKS } from "@/lib/content";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-border">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">Lleva el orden a tus APIs.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
            Descarga Nala para Windows y ten todos tus backends FastAPI a un clic — gratis y en local.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={LINKS.download} size="lg"><Download size={18} /> Descargar para Windows</Button>
            <Button href={LINKS.github} variant="secondary" size="lg"><GitBranch size={18} /> Ver en GitHub</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
