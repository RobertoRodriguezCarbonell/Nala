//! Capa de acceso a datos sobre SQLite. Funciones puras que reciben `&Connection`;
//! los comandos Tauri se encargan del bloqueo del mutex.

use rusqlite::{params, Connection, Row};

use crate::error::AppError;
use crate::models::{
    Environment, EnvironmentInput, Header, HistoryEntry, Service, ServiceInput, SnapshotMeta,
    Variable, VariableInput,
};
use crate::models::NewHistoryEntry;

// ---------- Servicios ----------

fn map_service(row: &Row) -> rusqlite::Result<Service> {
    Ok(Service {
        id: row.get("id")?,
        name: row.get("name")?,
        group_name: row.get("group_name")?,
        color: row.get("color")?,
        icon: row.get("icon")?,
        spec_path: row.get("spec_path")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn create_service(conn: &Connection, input: &ServiceInput) -> Result<Service, AppError> {
    conn.execute(
        "INSERT INTO services (name, group_name, color, icon, spec_path)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.name, input.group_name, input.color, input.icon, input.spec_path],
    )?;
    get_service(conn, conn.last_insert_rowid())
}

pub fn list_services(conn: &Connection) -> Result<Vec<Service>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM services ORDER BY COALESCE(group_name, ''), name COLLATE NOCASE",
    )?;
    let rows = stmt.query_map([], map_service)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

pub fn get_service(conn: &Connection, id: i64) -> Result<Service, AppError> {
    conn.query_row("SELECT * FROM services WHERE id = ?1", params![id], map_service)
        .map_err(|_| AppError::NotFound(format!("servicio {id}")))
}

pub fn update_service(conn: &Connection, id: i64, input: &ServiceInput) -> Result<Service, AppError> {
    conn.execute(
        "UPDATE services
         SET name = ?1, group_name = ?2, color = ?3, icon = ?4, spec_path = ?5,
             updated_at = datetime('now')
         WHERE id = ?6",
        params![input.name, input.group_name, input.color, input.icon, input.spec_path, id],
    )?;
    get_service(conn, id)
}

pub fn delete_service(conn: &Connection, id: i64) -> Result<(), AppError> {
    conn.execute("DELETE FROM services WHERE id = ?1", params![id])?;
    Ok(())
}

// ---------- Entornos ----------

fn map_environment(row: &Row) -> rusqlite::Result<Environment> {
    Ok(Environment {
        id: row.get("id")?,
        service_id: row.get("service_id")?,
        name: row.get("name")?,
        base_url: row.get("base_url")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn create_environment(conn: &Connection, input: &EnvironmentInput) -> Result<Environment, AppError> {
    conn.execute(
        "INSERT INTO environments (service_id, name, base_url) VALUES (?1, ?2, ?3)",
        params![input.service_id, input.name, input.base_url],
    )?;
    get_environment(conn, conn.last_insert_rowid())
}

pub fn list_environments(conn: &Connection, service_id: i64) -> Result<Vec<Environment>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM environments WHERE service_id = ?1 ORDER BY id",
    )?;
    let rows = stmt.query_map(params![service_id], map_environment)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

pub fn get_environment(conn: &Connection, id: i64) -> Result<Environment, AppError> {
    conn.query_row("SELECT * FROM environments WHERE id = ?1", params![id], map_environment)
        .map_err(|_| AppError::NotFound(format!("entorno {id}")))
}

pub fn update_environment(
    conn: &Connection,
    id: i64,
    name: &str,
    base_url: &str,
) -> Result<Environment, AppError> {
    conn.execute(
        "UPDATE environments SET name = ?1, base_url = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![name, base_url, id],
    )?;
    get_environment(conn, id)
}

pub fn delete_environment(conn: &Connection, id: i64) -> Result<(), AppError> {
    conn.execute("DELETE FROM environments WHERE id = ?1", params![id])?;
    Ok(())
}

// ---------- Snapshots ----------

fn map_snapshot_meta(row: &Row) -> rusqlite::Result<SnapshotMeta> {
    Ok(SnapshotMeta {
        id: row.get("id")?,
        service_id: row.get("service_id")?,
        openapi_version: row.get("openapi_version")?,
        api_title: row.get("api_title")?,
        api_version: row.get("api_version")?,
        endpoint_count: row.get("endpoint_count")?,
        fetched_at: row.get("fetched_at")?,
    })
}

#[allow(clippy::too_many_arguments)]
pub fn insert_snapshot(
    conn: &Connection,
    service_id: i64,
    raw_spec: &str,
    openapi_version: &str,
    api_title: Option<&str>,
    api_version: Option<&str>,
    endpoint_count: i64,
) -> Result<SnapshotMeta, AppError> {
    conn.execute(
        "INSERT INTO schema_snapshots
         (service_id, raw_spec, openapi_version, api_title, api_version, endpoint_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![service_id, raw_spec, openapi_version, api_title, api_version, endpoint_count],
    )?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, service_id, openapi_version, api_title, api_version, endpoint_count, fetched_at
         FROM schema_snapshots WHERE id = ?1",
        params![id],
        map_snapshot_meta,
    )
    .map_err(AppError::from)
}

pub fn list_snapshots(conn: &Connection, service_id: i64) -> Result<Vec<SnapshotMeta>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, service_id, openapi_version, api_title, api_version, endpoint_count, fetched_at
         FROM schema_snapshots WHERE service_id = ?1 ORDER BY id DESC",
    )?;
    let rows = stmt.query_map(params![service_id], map_snapshot_meta)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// Devuelve el `raw_spec` del snapshot más reciente de un servicio, si existe.
pub fn latest_raw_spec(conn: &Connection, service_id: i64) -> Result<Option<String>, AppError> {
    let spec = conn
        .query_row(
            "SELECT raw_spec FROM schema_snapshots WHERE service_id = ?1 ORDER BY id DESC LIMIT 1",
            params![service_id],
            |row| row.get::<_, String>(0),
        )
        .ok();
    Ok(spec)
}

// ---------- Variables ----------

fn map_variable(row: &Row) -> rusqlite::Result<Variable> {
    Ok(Variable {
        id: row.get("id")?,
        scope: row.get("scope")?,
        scope_id: row.get("scope_id")?,
        key: row.get("key")?,
        value: row.get("value")?,
        is_secret: row.get::<_, i64>("is_secret")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

/// Devuelve las variables relevantes a un contexto: globales + las del servicio
/// + las del entorno indicados (si se dan). El frontend resuelve la precedencia.
pub fn list_variables(
    conn: &Connection,
    service_id: Option<i64>,
    environment_id: Option<i64>,
) -> Result<Vec<Variable>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM variables
         WHERE scope = 'global'
            OR (scope = 'service' AND scope_id = ?1)
            OR (scope = 'environment' AND scope_id = ?2)
         ORDER BY scope, key COLLATE NOCASE",
    )?;
    let rows = stmt.query_map(params![service_id, environment_id], map_variable)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// Inserta o actualiza una variable por (scope, scope_id, key).
pub fn upsert_variable(conn: &Connection, input: &VariableInput) -> Result<Variable, AppError> {
    conn.execute(
        "INSERT INTO variables (scope, scope_id, key, value, is_secret)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (scope, IFNULL(scope_id, -1), key)
         DO UPDATE SET value = excluded.value, is_secret = excluded.is_secret,
                       updated_at = datetime('now')",
        params![
            input.scope,
            input.scope_id,
            input.key,
            input.value,
            input.is_secret as i64
        ],
    )?;
    conn.query_row(
        "SELECT * FROM variables
         WHERE scope = ?1 AND IFNULL(scope_id, -1) = IFNULL(?2, -1) AND key = ?3",
        params![input.scope, input.scope_id, input.key],
        map_variable,
    )
    .map_err(AppError::from)
}

pub fn delete_variable(conn: &Connection, id: i64) -> Result<(), AppError> {
    conn.execute("DELETE FROM variables WHERE id = ?1", params![id])?;
    Ok(())
}

// ---------- Auth ----------

/// Devuelve `(kind, config_json)` de un servicio; `('none', '{}')` si no hay fila.
pub fn get_auth_strategy(conn: &Connection, service_id: i64) -> Result<(String, String), AppError> {
    let row = conn
        .query_row(
            "SELECT kind, config FROM auth_strategy WHERE service_id = ?1",
            params![service_id],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)),
        )
        .ok();
    Ok(row.unwrap_or_else(|| ("none".to_string(), "{}".to_string())))
}

pub fn set_auth_strategy(
    conn: &Connection,
    service_id: i64,
    kind: &str,
    config: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO auth_strategy (service_id, kind, config) VALUES (?1, ?2, ?3)
         ON CONFLICT(service_id) DO UPDATE SET kind = excluded.kind, config = excluded.config",
        params![service_id, kind, config],
    )?;
    Ok(())
}

/// Devuelve el secreto cifrado de un entorno, si lo hay.
pub fn get_environment_secret(
    conn: &Connection,
    environment_id: i64,
) -> Result<Option<String>, AppError> {
    let secret = conn
        .query_row(
            "SELECT secret FROM environment_auth WHERE environment_id = ?1",
            params![environment_id],
            |r| r.get::<_, Option<String>>(0),
        )
        .ok()
        .flatten();
    Ok(secret)
}

pub fn set_environment_secret(
    conn: &Connection,
    environment_id: i64,
    ciphertext: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO environment_auth (environment_id, secret) VALUES (?1, ?2)
         ON CONFLICT(environment_id) DO UPDATE SET secret = excluded.secret",
        params![environment_id, ciphertext],
    )?;
    Ok(())
}

pub fn clear_environment_secret(conn: &Connection, environment_id: i64) -> Result<(), AppError> {
    conn.execute(
        "DELETE FROM environment_auth WHERE environment_id = ?1",
        params![environment_id],
    )?;
    Ok(())
}

/// Fila de `environment_auth` con los campos de auth de un entorno (cifrados).
/// Todos los textos son ciphertext; el descifrado ocurre en la capa de comandos.
#[derive(Debug, Clone, Default)]
pub struct EnvAuthRow {
    pub secret: Option<String>,
    pub cached_token: Option<String>,
    pub token_expires_at: Option<i64>,
    pub remember_credentials: bool,
    pub credentials: Option<String>,
}

/// Lee la fila de auth de un entorno; valores por defecto si no existe.
pub fn get_environment_auth(conn: &Connection, environment_id: i64) -> Result<EnvAuthRow, AppError> {
    let row = conn
        .query_row(
            "SELECT secret, cached_token, token_expires_at, remember_credentials, credentials
             FROM environment_auth WHERE environment_id = ?1",
            params![environment_id],
            |r| {
                Ok(EnvAuthRow {
                    secret: r.get(0)?,
                    cached_token: r.get(1)?,
                    token_expires_at: r.get(2)?,
                    remember_credentials: r.get::<_, i64>(3)? != 0,
                    credentials: r.get(4)?,
                })
            },
        )
        .ok();
    Ok(row.unwrap_or_default())
}

pub fn set_environment_token(
    conn: &Connection,
    environment_id: i64,
    cipher: &str,
    expires_at: Option<i64>,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO environment_auth (environment_id, cached_token, token_expires_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(environment_id)
         DO UPDATE SET cached_token = excluded.cached_token,
                       token_expires_at = excluded.token_expires_at",
        params![environment_id, cipher, expires_at],
    )?;
    Ok(())
}

pub fn set_environment_credentials(
    conn: &Connection,
    environment_id: i64,
    cipher: Option<&str>,
    remember: bool,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO environment_auth (environment_id, credentials, remember_credentials)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(environment_id)
         DO UPDATE SET credentials = excluded.credentials,
                       remember_credentials = excluded.remember_credentials",
        params![environment_id, cipher, remember as i64],
    )?;
    Ok(())
}

// ---------- Historial ----------

fn parse_headers(s: &str) -> Vec<Header> {
    serde_json::from_str(s).unwrap_or_default()
}

fn map_history(row: &Row) -> rusqlite::Result<HistoryEntry> {
    Ok(HistoryEntry {
        id: row.get("id")?,
        service_id: row.get("service_id")?,
        environment_id: row.get("environment_id")?,
        method: row.get("method")?,
        url: row.get("url")?,
        request_headers: parse_headers(&row.get::<_, String>("request_headers")?),
        request_body: row.get("request_body")?,
        status: row.get("status")?,
        status_text: row.get("status_text")?,
        time_ms: row.get("time_ms")?,
        size_bytes: row.get("size_bytes")?,
        content_type: row.get("content_type")?,
        response_headers: parse_headers(&row.get::<_, String>("response_headers")?),
        response_body: row.get("response_body")?,
        error: row.get("error")?,
        created_at: row.get("created_at")?,
    })
}

pub fn insert_history(conn: &Connection, e: &NewHistoryEntry) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO history
         (service_id, environment_id, method, url, request_headers, request_body,
          status, status_text, time_ms, size_bytes, content_type,
          response_headers, response_body, error)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            e.service_id, e.environment_id, e.method, e.url, e.request_headers, e.request_body,
            e.status, e.status_text, e.time_ms, e.size_bytes, e.content_type,
            e.response_headers, e.response_body, e.error
        ],
    )?;
    Ok(())
}

pub fn list_history(conn: &Connection, service_id: i64) -> Result<Vec<HistoryEntry>, AppError> {
    let mut stmt = conn.prepare("SELECT * FROM history WHERE service_id = ?1 ORDER BY id DESC")?;
    let rows = stmt.query_map(params![service_id], map_history)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

pub fn clear_history(conn: &Connection, service_id: i64) -> Result<(), AppError> {
    conn.execute("DELETE FROM history WHERE service_id = ?1", params![service_id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::models::{EnvironmentInput, ServiceInput};

    fn seed(conn: &Connection) -> (i64, i64) {
        let svc = create_service(
            conn,
            &ServiceInput {
                name: "S".into(),
                group_name: None,
                color: None,
                icon: None,
                spec_path: "/openapi.json".into(),
            },
        )
        .unwrap();
        let env = create_environment(
            conn,
            &EnvironmentInput {
                service_id: svc.id,
                name: "local".into(),
                base_url: "http://x".into(),
            },
        )
        .unwrap();
        (svc.id, env.id)
    }

    #[test]
    fn history_insert_list_clear() {
        let conn = db::open_in_memory();
        let (svc, env) = seed(&conn);
        assert!(list_history(&conn, svc).unwrap().is_empty());

        let entry = crate::models::NewHistoryEntry {
            service_id: svc,
            environment_id: Some(env),
            method: "GET".into(),
            url: "http://x/r".into(),
            request_headers: r#"[{"name":"Authorization","value":"••••"}]"#.into(),
            request_body: None,
            status: Some(200),
            status_text: "OK".into(),
            time_ms: 12,
            size_bytes: 34,
            content_type: Some("application/json".into()),
            response_headers: "[]".into(),
            response_body: "{}".into(),
            error: None,
        };
        insert_history(&conn, &entry).unwrap();
        insert_history(&conn, &entry).unwrap();

        let rows = list_history(&conn, svc).unwrap();
        assert_eq!(rows.len(), 2);
        assert!(rows[0].id > rows[1].id); // id DESC
        assert_eq!(rows[0].status, Some(200));
        assert_eq!(rows[0].request_headers.len(), 1);
        assert_eq!(rows[0].request_headers[0].value, "••••");

        clear_history(&conn, svc).unwrap();
        assert!(list_history(&conn, svc).unwrap().is_empty());
    }

    #[test]
    fn auth_strategy_defaults_and_upsert() {
        let conn = db::open_in_memory();
        let (svc, _env) = seed(&conn);
        assert_eq!(
            get_auth_strategy(&conn, svc).unwrap(),
            ("none".to_string(), "{}".to_string())
        );
        set_auth_strategy(&conn, svc, "apiKey", r#"{"name":"X-API-Key","in":"header"}"#).unwrap();
        let (kind, config) = get_auth_strategy(&conn, svc).unwrap();
        assert_eq!(kind, "apiKey");
        assert!(config.contains("X-API-Key"));
    }

    #[test]
    fn environment_secret_set_get_clear() {
        let conn = db::open_in_memory();
        let (_svc, env) = seed(&conn);
        assert_eq!(get_environment_secret(&conn, env).unwrap(), None);
        set_environment_secret(&conn, env, "cipher==").unwrap();
        assert_eq!(get_environment_secret(&conn, env).unwrap(), Some("cipher==".to_string()));
        clear_environment_secret(&conn, env).unwrap();
        assert_eq!(get_environment_secret(&conn, env).unwrap(), None);
    }

    #[test]
    fn environment_token_set_and_get() {
        let conn = db::open_in_memory();
        let (_svc, env) = seed(&conn);
        assert!(get_environment_auth(&conn, env).unwrap().cached_token.is_none());

        set_environment_token(&conn, env, "tok_cipher", Some(4600)).unwrap();
        let row = get_environment_auth(&conn, env).unwrap();
        assert_eq!(row.cached_token.as_deref(), Some("tok_cipher"));
        assert_eq!(row.token_expires_at, Some(4600));
    }

    #[test]
    fn environment_credentials_remember_and_forget() {
        let conn = db::open_in_memory();
        let (_svc, env) = seed(&conn);
        set_environment_credentials(&conn, env, Some("creds_cipher"), true).unwrap();
        let row = get_environment_auth(&conn, env).unwrap();
        assert!(row.remember_credentials);
        assert_eq!(row.credentials.as_deref(), Some("creds_cipher"));

        set_environment_credentials(&conn, env, None, false).unwrap();
        let row = get_environment_auth(&conn, env).unwrap();
        assert!(!row.remember_credentials);
        assert!(row.credentials.is_none());
    }
}
