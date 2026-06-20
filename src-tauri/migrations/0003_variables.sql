-- Fase 3 · Variables para interpolación {{var}}.
-- Ámbito: global / service / environment. La precedencia (entorno > servicio >
-- global) se resuelve al construir el mapa de variables. `is_secret` se cifrará
-- a nivel de campo en la Fase 4; en la Fase 3 se usa para variables no secretas.
CREATE TABLE IF NOT EXISTS variables (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    scope       TEXT NOT NULL CHECK (scope IN ('global', 'service', 'environment')),
    scope_id    INTEGER,
    key         TEXT NOT NULL,
    value       TEXT NOT NULL DEFAULT '',
    is_secret   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Una clave única por ámbito (IFNULL para el caso global, sin scope_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_variables_scope_key
    ON variables (scope, IFNULL(scope_id, -1), key);
