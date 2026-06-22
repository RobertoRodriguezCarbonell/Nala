"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import type { SearchDoc } from "@/lib/docs/search-index";

interface Hit {
  slug: string;
  title: string;
  hint: string;
  hash: string;
}

export function Search({ index }: { index: SearchDoc[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits: Hit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Hit[] = [];
    for (const d of index) {
      if (d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) {
        out.push({ slug: d.slug, title: d.title, hint: d.description, hash: "" });
      }
      for (const h of d.headings) {
        if (h.text.toLowerCase().includes(q)) {
          out.push({ slug: d.slug, title: d.title, hint: h.text, hash: `#${h.id}` });
        }
      }
    }
    return out.slice(0, 12);
  }, [query, index]);

  const go = (h: Hit) => {
    setOpen(false);
    setQuery("");
    router.push(`/docs/${h.slug}${h.hash}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg-faint hover:text-fg"
      >
        <SearchIcon size={14} /> Buscar
        <span className="ml-2 hidden font-mono text-[10px] sm:inline">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-bg/80" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-strong bg-raised shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <SearchIcon size={16} className="text-fg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSel(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && hits[sel]) go(hits[sel]);
                }}
                placeholder="Buscar en la documentación…"
                className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-fg-faint"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {query && hits.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-fg-faint">Sin resultados</li>
              )}
              {hits.map((h, i) => (
                <li key={`${h.slug}${h.hash}`}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(h)}
                    className={`flex w-full flex-col items-start rounded-md px-3 py-2 text-left ${i === sel ? "bg-accent/10" : ""}`}
                  >
                    <span className="text-sm text-fg">{h.title}</span>
                    {h.hint && <span className="truncate text-xs text-fg-faint">{h.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
