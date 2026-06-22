"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

interface MagicCardProps {
  children?: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

/** Tarjeta con borde y foco que siguen al cursor (estilo Magic UI), de marca. */
export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientColor = "rgba(79, 70, 229, 0.14)",
  gradientOpacity = 0.9,
  gradientFrom = "#4d8bf0",
  gradientTo = "#4f46e5",
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize * 10);
  const mouseY = useMotionValue(-gradientSize * 10);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cardRef.current) return;
      const { left, top } = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize * 10);
    mouseY.set(-gradientSize * 10);
  }, [mouseX, mouseY, gradientSize]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={cardRef} className={cn("group relative rounded-xl", className)}>
      {/* Borde que se ilumina cerca del cursor. */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${gradientFrom}, ${gradientTo}, var(--color-border) 100%)
          `,
        }}
      />
      {/* Relleno de la tarjeta (deja ver el borde de 1px). */}
      <div className="absolute inset-px rounded-[inherit] bg-card" />
      {/* Foco interior tenue. */}
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit]"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${gradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
