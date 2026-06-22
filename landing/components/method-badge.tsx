import { cn } from "@/lib/cn";

const COLORS: Record<string, string> = {
  GET: "text-get", POST: "text-post", PUT: "text-put", PATCH: "text-patch", DELETE: "text-delete",
};

export function MethodBadge({ method, className }: { method: string; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] font-bold", COLORS[method] ?? "text-fg-faint", className)}>
      {method}
    </span>
  );
}
