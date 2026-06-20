//! Capa de acceso a datos sobre SQLite. Funciones puras que reciben `&Connection`;
//! los comandos Tauri se encargan del bloqueo del mutex.

use rusqlite::{params, Connection, Row};

use crate::error::AppError;
use crate::models::{
    Environment, EnvironmentInput, Service, ServiceInput, SnapshotMeta, Variable, VariableInput,
};

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
}
