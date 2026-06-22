import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/docs/sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/nala-logo.svg" alt="Nala" width={24} height={24} className="rounded-md" />
            <span className="font-semibold tracking-tight">
              Nala <span className="text-fg-faint">/ Docs</span>
            </span>
          </Link>
          <Link href="/" className="ml-auto flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <ArrowLeft size={15} /> Inicio
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-6 py-4">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
