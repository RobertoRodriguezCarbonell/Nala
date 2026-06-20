-- Fase 4 · Parte B — flujo de login: token cacheado y credenciales por entorno.
ALTER TABLE environment_auth ADD COLUMN cached_token TEXT;                          -- token cifrado AES-GCM; NULL = sin token
ALTER TABLE environment_auth ADD COLUMN token_expires_at INTEGER;                   -- epoch unix (s); NULL = sin caducidad conocida
ALTER TABLE environment_auth ADD COLUMN remember_credentials INTEGER NOT NULL DEFAULT 0;
ALTER TABLE environment_auth ADD COLUMN credentials TEXT;                           -- {user,pass} JSON cifrado; NULL si no se recuerdan
