import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

/** Texto con un brillo que lo recorre periódicamente (estilo Magic UI). */
export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 90,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={{ "--shiny-width": `${shimmerWidth}px` } as CSSProperties}
      className={cn(
        "animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%] text-fg-muted/70",
        "bg-linear-to-r from-transparent via-fg/90 via-50% to-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
