import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El repo raíz (Tauri) tiene su propio package-lock.json; fijamos la raíz
  // del workspace a esta carpeta para que Next no infiera mal el root.
  turbopack: { root: __dirname },
};

export default nextConfig;
