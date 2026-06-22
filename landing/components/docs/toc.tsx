"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/docs/source";

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return <div className="hidden xl:block xl:w-56 xl:shrink-0" />;

  return (
    <aside className="hidden xl:block xl:w-56 xl:shrink-0">
      <div className="sticky top-24">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-fg-faint">
          En esta página
        </div>
        <ul className="space-y-1.5 text-sm">
          {items.map((it) => (
            <li key={it.id} className={it.depth === 3 ? "pl-3" : ""}>
              <a
                href={`#${it.id}`}
                className={`block transition-colors ${
                  active === it.id ? "text-accent" : "text-fg-faint hover:text-fg"
                }`}
              >
                {it.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
