import type { ReactNode } from "react";
import { Info, TriangleAlert, Lightbulb, OctagonAlert, type LucideIcon } from "lucide-react";

type CalloutType = "info" | "warning" | "tip" | "danger";

const STYLE: Record<CalloutType, { icon: LucideIcon; cls: string }> = {
  info: { icon: Info, cls: "border-accent/30 bg-accent/10 text-accent" },
  tip: { icon: Lightbulb, cls: "border-get/30 bg-get/10 text-get" },
  warning: { icon: TriangleAlert, cls: "border-post/30 bg-post/10 text-post" },
  danger: { icon: OctagonAlert, cls: "border-delete/30 bg-delete/10 text-delete" },
};

export function Callout({ type = "info", children }: { type?: CalloutType; children: ReactNode }) {
  const { icon: Icon, cls } = STYLE[type];
  return (
    <div className={`mt-5 flex gap-3 rounded-lg border p-4 ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-sm leading-relaxed text-fg-muted [&>p]:mt-0 [&>p+p]:mt-2">{children}</div>
    </div>
  );
}
