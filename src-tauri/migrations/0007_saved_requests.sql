CREATE TABLE IF NOT EXISTS saved_requests (
    id              INTEGER PRIMARY KEY,
    service_id      INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    method          TEXT NOT NULL,
    path            TEXT NOT NULL,
    operation_id    TEXT,
    draft_json      TEXT NOT NULL,
    is_smoke        INTEGER NOT NULL DEFAULT 1,
    expected_status TEXT NOT NULL DEFAULT '2xx',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_requests_service ON saved_requests(service_id);
