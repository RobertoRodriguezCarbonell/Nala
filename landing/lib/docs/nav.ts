export interface DocPage {
  slug: string;
  title: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

/** Fuente de verdad: orden del sidebar, rutas, prev/next y buscador. */
export const NAV: DocSection[] = [
  {
    title: "Empezar",
    pages: [
      { slug: "empezar-introduccion", title: "Introducción" },
      { slug: "empezar-instalacion", title: "Instalación" },
      { slug: "empezar-inicio-rapido", title: "Inicio rápido" },
    ],
  },
  {
    title: "Conceptos",
    pages: [
      { slug: "conceptos-modelo-dominio", title: "Modelo de dominio" },
      { slug: "conceptos-arquitectura", title: "Arquitectura" },
    ],
  },
  {
    title: "Guías",
    pages: [
      { slug: "guias-importar-openapi", title: "Importar desde OpenAPI" },
      { slug: "guias-entornos-variables", title: "Entornos y variables" },
      { slug: "guias-construir-peticiones", title: "Construir y enviar peticiones" },
      { slug: "guias-autenticacion", title: "Autenticación" },
      { slug: "guias-visualizar-respuestas", title: "Visualizar respuestas" },
      { slug: "guias-diff-esquemas", title: "Diff de esquemas" },
      { slug: "guias-tipos-cliente-ts", title: "Tipos y cliente TypeScript" },
      { slug: "guias-smoke-tests", title: "Smoke tests" },
      { slug: "guias-secuencias", title: "Secuencias multi-paso" },
      { slug: "guias-descubrimiento-localhost", title: "Descubrimiento de localhost" },
      { slug: "guias-historial", title: "Historial" },
    ],
  },
  {
    title: "Referencia",
    pages: [
      { slug: "referencia-interpolacion", title: "Interpolación de variables" },
      { slug: "referencia-seguridad-datos", title: "Seguridad y datos" },
      { slug: "referencia-atajos-ui", title: "Atajos y UI" },
      { slug: "referencia-faq", title: "FAQ y solución de problemas" },
    ],
  },
];

export const ALL_PAGES: DocPage[] = NAV.flatMap((s) => s.pages);
