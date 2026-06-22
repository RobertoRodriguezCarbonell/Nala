"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/docs/nav";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const tree = (
    <nav className="space-y-6">
      {NAV.map((section) => (
        <div key={section.title}>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-fg-faint">
            {section.title}
          </div>
          <ul className="space-y-0.5">
            {section.pages.map((p) => {
              const active = pathname === `/docs/${p.slug}`;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/docs/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      active ? "bg-accent/10 text-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-fg-muted lg:hidden"
        aria-label="Abrir navegación"
      >
        <Menu size={16} /> Navegación
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">{tree}</div>
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-bg/80" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-raised p-5">
            <button onClick={() => setOpen(false)} className="mb-4 text-fg-faint" aria-label="Cerrar">
              <X size={18} />
            </button>
            {tree}
          </div>
        </div>
      )}
    </>
  );
}
