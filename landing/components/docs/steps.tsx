import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 ml-3 border-l border-border [counter-reset:step] [&>*]:relative [&>*]:pb-2">
      {children}
    </div>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="[counter-increment:step] pl-6 pb-6 last:pb-0">
      <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-raised font-mono text-[11px] text-accent before:content-[counter(step)]" />
      <h4 className="font-semibold text-fg">{title}</h4>
      <div className="mt-1 text-sm leading-relaxed text-fg-muted [&>p]:mt-2">{children}</div>
    </div>
  );
}
