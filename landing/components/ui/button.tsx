import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors whitespace-nowrap disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-accent text-bg hover:bg-accent-hover",
        secondary: "border border-border-strong bg-transparent text-fg-muted hover:border-fg-faint hover:text-fg",
        ghost: "bg-transparent text-fg-faint hover:text-fg",
      },
      size: { md: "h-10 px-5 text-sm", lg: "h-12 px-7 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof button> {}

/** Botón-enlace (la landing solo navega; no hay acciones de form). */
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <a className={cn(button({ variant, size }), className)} {...props} />;
}
