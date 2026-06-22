import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/lib/content";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <Image src="/nala-logo.svg" alt="Nala" width={26} height={26} className="rounded-md" />
          <span className="font-semibold tracking-tight">Nala</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-fg-muted md:flex">
          <a href="#caracteristicas" className="hover:text-fg">Características</a>
          <a href="#como-funciona" className="hover:text-fg">Cómo funciona</a>
          <Link href="/docs" className="hover:text-fg">Docs</Link>
          <a href={LINKS.github} className="hover:text-fg">GitHub</a>
        </nav>
        <Button href={LINKS.download} size="md">Descargar</Button>
      </div>
    </header>
  );
}
