import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => <h1 className="text-3xl font-bold tracking-tight" {...props} />,
  h2: (props) => <h2 className="mt-10 scroll-mt-24 text-xl font-semibold tracking-tight" {...props} />,
  h3: (props) => <h3 className="mt-8 scroll-mt-24 text-lg font-semibold" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-fg-muted" {...props} />,
  a: (props) => <a className="text-accent underline-offset-2 hover:underline" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-1.5 pl-5 text-fg-muted" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-fg-muted" {...props} />,
  code: (props) => <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg" {...props} />,
  pre: (props) => <pre className="mt-4 overflow-x-auto rounded-xl border border-border-strong bg-card p-4 font-mono text-[13px] leading-relaxed" {...props} />,
};
