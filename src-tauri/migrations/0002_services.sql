-- Fase 2 · Servicios + motor OpenAPI.
-- Un Servicio es la identidad lógica de una API (sin URL: la URL vive en el
-- entorno). Un Entorno aporta la base URL concreta. Un Snapshot guarda el
-- openapi.json íntegro en un momento dado; las operaciones se derivan en memoria.

CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    group_name  TEXT,
    color       TEXT,
    icon        TEXT,
    spec_path   TEXT NOT NULL DEFAULT '/openapi.json',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS environments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id  INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    base_url    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_environments_service ON environments(service_id);

CREATE TABLE IF NOT EXISTS schema_snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id      INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    raw_spec        TEXT NOT NULL,
    openapi_version TEXT NOT NULL,
    api_title       TEXT,
    api_version     TEXT,
    endpoint_count  INTEGER NOT NULL DEFAULT 0,
    fetched_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_service ON schema_snapshots(service_id);
