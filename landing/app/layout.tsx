import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nala — Cliente de escritorio para APIs FastAPI",
  description:
    "Centraliza, prueba y mantén al día tus APIs FastAPI. Importa desde OpenAPI, genera tipos y clientes TypeScript, caza breaking changes y automatiza flujos — todo en local.",
  icons: { icon: "/nala-logo.svg" },
  openGraph: {
    title: "Nala — Cliente de escritorio para APIs FastAPI",
    description:
      "Centraliza, prueba y mantén al día tus APIs FastAPI. Local-first, para Windows.",
    type: "website",
  },
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
