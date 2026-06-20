-- Fase 4 · Parte A — autenticación estática.
-- Estrategia de auth por servicio (config no secreta).
CREATE TABLE IF NOT EXISTS auth_strategy (
    service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL DEFAULT 'none',   -- 'none' | 'bearer' | 'apiKey'
    config     TEXT NOT NULL DEFAULT '{}'      -- JSON por tipo
);

-- Secreto de auth por entorno (token estático / valor de API key), cifrado AES-GCM.
CREATE TABLE IF NOT EXISTS environment_auth (
    environment_id INTEGER PRIMARY KEY REFERENCES environments(id) ON DELETE CASCADE,
    secret         TEXT   -- base64(nonce||ciphertext); NULL = sin configurar
);
