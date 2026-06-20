use rusqlite::params;
use tauri::State;

use crate::error::AppError;
use crate::keychain;
use crate::AppState;

/// Lee un valor de la tabla `settings`. Devuelve `None` si la clave no existe.
#[tauri::command]
pub fn get_setting(state: State<AppState>, key: String) -> Result<Option<String>, AppError> {
    let conn = state.db.lock().expect("db lock");
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query(params![key])?;
    match rows.next()? {
        Some(row) => Ok(Some(row.get(0)?)),
        None => Ok(None),
    }
}

/// Inserta o actualiza (upsert) un valor en la tabla `settings`.
#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), AppError> {
    let conn = state.db.lock().expect("db lock");
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

/// Garantiza que la clave de cifrado existe en el Credential Manager.
/// Devuelve `true` cuando está lista.
#[tauri::command]
pub fn ensure_encryption_key() -> Result<bool, AppError> {
    keychain::ensure_key()?;
    Ok(true)
}
