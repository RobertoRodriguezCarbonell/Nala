import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { ALL_PAGES, type DocPage } from "@/lib/docs/nav";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export interface TocItem {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface Doc {
  slug: string;
  title: string;
  description: string;
  content: string;
  toc: TocItem[];
}

export function getDocSlugs(): string[] {
  return ALL_PAGES.map((p) => p.slug);
}

/** Extrae encabezados ## y ### del cuerpo MDX, ignorando bloques de código. */
function extractToc(content: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const depth = m[1].length as 2 | 3;
    const text = m[2].replace(/[`*_]/g, "").trim();
    toc.push({ depth, text, id: slugger.slug(text) });
  }
  return toc;
}

export function getDoc(slug: string): Doc | null {
  const file = path.join(DOCS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    content,
    toc: extractToc(content),
  };
}

export function getAdjacent(slug: string): { prev?: DocPage; next?: DocPage } {
  const i = ALL_PAGES.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? ALL_PAGES[i - 1] : undefined,
    next: i < ALL_PAGES.length - 1 ? ALL_PAGES[i + 1] : undefined,
  };
}
