import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { Callout } from "@/components/docs/callout";
import { Steps, Step } from "@/components/docs/steps";
import { Kbd } from "@/components/docs/kbd";
import { MethodBadge } from "@/components/method-badge";

function Anchor({ href = "", ...props }: { href?: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link href={href} className="text-accent underline-offset-2 hover:underline" {...props} />;
  }
  return <a href={href} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline" {...props} />;
}

export const mdxComponents: MDXComponents = {
  h1: (props) => <h1 className="text-3xl font-bold tracking-tight text-fg" {...props} />,
  h2: (props) => <h2 className="mt-12 scroll-mt-24 border-b border-border pb-2 text-xl font-semibold tracking-tight text-fg" {...props} />,
  h3: (props) => <h3 className="mt-8 scroll-mt-24 text-lg font-semibold text-fg" {...props} />,
  h4: (props) => <h4 className="mt-6 scroll-mt-24 font-semibold text-fg" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-fg-muted" {...props} />,
  a: Anchor,
  ul: (props) => <ul className="mt-4 list-disc space-y-1.5 pl-5 text-fg-muted marker:text-fg-faint" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-fg-muted marker:text-fg-faint" {...props} />,
  li: (props) => <li className="leading-relaxed [&>ul]:mt-1.5" {...props} />,
  strong: (props) => <strong className="font-semibold text-fg" {...props} />,
  blockquote: (props) => <blockquote className="mt-5 border-l-2 border-border-strong pl-4 text-fg-faint italic" {...props} />,
  hr: () => <hr className="my-10 border-border" />,
  table: (props) => <div className="mt-5 overflow-x-auto"><table className="w-full border-collapse text-sm" {...props} /></div>,
  thead: (props) => <thead className="border-b border-border-strong text-left text-fg" {...props} />,
  th: (props) => <th className="px-3 py-2 font-semibold" {...props} />,
  td: (props) => <td className="border-b border-border px-3 py-2 text-fg-muted" {...props} />,
  code: (props) => <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg" {...props} />,
  pre: CodeBlock,
  Callout,
  Steps,
  Step,
  Kbd,
  MethodBadge,
};
