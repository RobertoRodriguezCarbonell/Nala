import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { getDoc, getDocSlugs } from "@/lib/docs/source";
import { mdxComponents } from "@/components/docs/mdx-components";

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
  const doc = getDoc(slug.join("/"));
  if (!doc) notFound();

  return (
    <article className="min-w-0 max-w-[72ch] py-10">
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
    </article>
  );
}
