"use client";

import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { Check, Copy } from "lucide-react";

/** Envuelve el <pre> resaltado por rehype-pretty-code y añade «Copiar». */
export function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative mt-4">
      <button
        onClick={copy}
        aria-label="Copiar código"
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-raised px-2 py-1 font-mono text-[11px] text-fg-faint opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
      <pre
        ref={ref}
        className="overflow-x-auto rounded-xl border border-border-strong bg-card p-4 font-mono text-[13px] leading-relaxed [&_code]:bg-transparent [&_code]:p-0"
        {...props}
      />
    </div>
  );
}
