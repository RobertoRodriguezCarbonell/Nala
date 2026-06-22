import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-raised px-3 py-1 font-mono text-xs text-fg-muted",
        className
      )}
      {...props}
    />
  );
}
