-- Migración inicial de Nala (Fase 1 · esqueleto).
-- Tabla clave/valor para estado y preferencias de la app.
-- El modelo de dominio (servicios, entornos, snapshots…) llega en la Fase 2.
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
