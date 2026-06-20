-- Fase 5 · Historial de ejecuciones (auth redactada).
CREATE TABLE IF NOT EXISTS history (
    id               INTEGER PRIMARY KEY,
    service_id       INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    environment_id   INTEGER,
    method           TEXT NOT NULL,
    url              TEXT NOT NULL,
    request_headers  TEXT NOT NULL,
    request_body     TEXT,
    status           INTEGER,
    status_text      TEXT NOT NULL DEFAULT '',
    time_ms          INTEGER NOT NULL DEFAULT 0,
    size_bytes       INTEGER NOT NULL DEFAULT 0,
    content_type     TEXT,
    response_headers TEXT NOT NULL DEFAULT '[]',
    response_body    TEXT NOT NULL DEFAULT '',
    error            TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_service ON history(service_id, id DESC);
