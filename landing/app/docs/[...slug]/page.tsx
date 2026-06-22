import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDoc, getDocSlugs, getAdjacent } from "@/lib/docs/source";
import { mdxComponents } from "@/components/docs/mdx-components";
import { Toc } from "@/components/docs/toc";

export function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug.join("/"));
  if (!doc) return {};
  return { title: `${doc.title} — Nala Docs`, description: doc.description };
}

const prettyCodeOptions = { theme: "github-dark-default", keepBackground: false };

export default async function DocPage(
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const key = slug.join("/");
  const doc = getDoc(key);
  if (!doc) notFound();
  const { prev, next } = getAdjacent(key);

  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-[72ch] flex-1 py-10">
        <MDXRemote
          source={doc.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
            },
          }}
        />

        <nav className="mt-14 flex justify-between gap-4 border-t border-border pt-6">
          {prev ? (
            <Link href={`/docs/${prev.slug}`} className="group flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
              <ChevronLeft size={16} /> {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/docs/${next.slug}`} className="group ml-auto flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
              {next.title} <ChevronRight size={16} />
            </Link>
          ) : <span />}
        </nav>
      </article>

      <Toc items={doc.toc} />
    </div>
  );
}
