import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { AppMockup } from "@/components/app-mockup";
import { GithubIcon } from "@/components/github-icon";
import { LINKS } from "@/lib/content";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Badge className="mx-auto">Local-first · Windows · FastAPI / OpenAPI</Badge>
          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            Todas tus APIs FastAPI, en una sola herramienta de escritorio.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-fg-muted">
            Da de alta un servicio pegando su URL y Nala importa sus endpoints desde OpenAPI.
            Pruébalos autenticados, genera tipos y clientes TypeScript, caza breaking changes y
            automatiza flujos — todo en local.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={LINKS.download} size="lg"><Download size={18} /> Descargar para Windows</Button>
            <Button href={LINKS.github} variant="secondary" size="lg"><GithubIcon size={18} /> Ver en GitHub</Button>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-16 max-w-4xl">
          <AppMockup />
        </Reveal>
      </div>
    </section>
  );
}
