mod commands;
mod db;
mod error;
mod keychain;

use std::sync::Mutex;

use tauri::Manager;

/// Estado global de la app: la conexión SQLite tras un mutex.
pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Carpeta de datos de la app (AppData\Roaming\com.nala.desktop en Windows).
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;

            let conn = db::open(&dir.join("nala.db"))?;
            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_setting,
            commands::set_setting,
            commands::ensure_encryption_key,
        ])
        .run(tauri::generate_context!())
        .expect("error al arrancar Nala");
}
