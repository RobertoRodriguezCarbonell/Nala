import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface BorderBeamProps {
  /** Duración de una vuelta completa, en segundos. */
  duration?: number;
  /** Desfase de inicio, en segundos (usa negativo para arrancar a media vuelta). */
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  /** Grosor del haz, en px. */
  width?: number;
  className?: string;
}

/**
 * Haz de luz que recorre el borde del contenedor (estilo Magic UI).
 * El padre debe ser `relative` con `rounded-*`; el haz hereda su radio.
 */
export function BorderBeam({
  duration = 7,
  delay = 0,
  colorFrom = "#4d8bf0",
  colorTo = "#4f46e5",
  width = 1.5,
  className,
}: BorderBeamProps) {
  return (
    <span
      aria-hidden
      className={cn("border-beam", className)}
      style={
        {
          "--beam-duration": `${duration}s`,
          "--beam-delay": `${delay}s`,
          "--beam-from": colorFrom,
          "--beam-to": colorTo,
          "--beam-width": `${width}px`,
        } as CSSProperties
      }
    />
  );
}
