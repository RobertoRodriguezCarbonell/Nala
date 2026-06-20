use std::path::Path;

use rusqlite::Connection;

use crate::error::AppError;

/// Migraciones embebidas en orden. El índice + 1 es la versión de cada una;
/// se aplican comparando contra `PRAGMA user_version`.
const MIGRATIONS: &[&str] = &[
    include_str!("../migrations/0001_init.sql"),
    include_str!("../migrations/0002_services.sql"),
    include_str!("../migrations/0003_variables.sql"),
    include_str!("../migrations/0004_auth.sql"),
];

/// Abre (o crea) la base de datos SQLite y aplica las migraciones pendientes.
pub fn open(path: &Path) -> Result<Connection, AppError> {
    let conn = Connection::open(path)?;
    // WAL para lecturas concurrentes; claves foráneas activas para el dominio futuro.
    conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    let mut version: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

    for (idx, sql) in MIGRATIONS.iter().enumerate() {
        let target = (idx + 1) as i64;
        if version < target {
            conn.execute_batch(sql)?;
            conn.pragma_update(None, "user_version", target)?;
            version = target;
        }
    }

    Ok(())
}

#[cfg(test)]
pub fn open_in_memory() -> Connection {
    let conn = Connection::open_in_memory().expect("memoria");
    conn.execute_batch("PRAGMA foreign_keys = ON;").expect("pragma");
    run_migrations(&conn).expect("migraciones");
    conn
}
