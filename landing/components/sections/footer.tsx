import Image from "next/image";
import { LINKS } from "@/lib/content";

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/nala-logo.svg" alt="Nala" width={22} height={22} className="rounded" />
          <span className="text-sm text-fg-muted">Nala · v1.0.0</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-fg-muted">
          <a href="#caracteristicas" className="hover:text-fg">Características</a>
          <a href="#como-funciona" className="hover:text-fg">Cómo funciona</a>
          <a href={LINKS.github} className="hover:text-fg">GitHub</a>
        </div>
        <span className="font-mono text-xs text-fg-faint">Hecho por Roberto Rodríguez Carbonell</span>
      </div>
    </footer>
  );
}
