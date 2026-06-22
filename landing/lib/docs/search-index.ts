import { ALL_PAGES } from "@/lib/docs/nav";
import { getDoc } from "@/lib/docs/source";

export interface SearchHeading {
  text: string;
  id: string;
}

export interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  headings: SearchHeading[];
}

export function buildSearchIndex(): SearchDoc[] {
  return ALL_PAGES.map((p) => {
    const doc = getDoc(p.slug);
    return {
      slug: p.slug,
      title: p.title,
      description: doc?.description ?? "",
      headings: (doc?.toc ?? []).map((t) => ({ text: t.text, id: t.id })),
    };
  });
}
