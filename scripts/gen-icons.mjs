// Rasteriza el logo SVG de Nala a un PNG de 1024px y deja que `tauri icon`
// genere el resto del set (.ico, .icns, png por tamaños).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "assets/nala-logo.svg");
const outDir = resolve(root, "src-tauri/icons");
const out = resolve(outDir, "icon-source.png");

mkdirSync(outDir, { recursive: true });

await sharp(src, { density: 512 })
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(out);

console.log("Icono fuente generado:", out);
