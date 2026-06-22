mod auth;
mod api;
mod commands;
mod crypto;
mod db;
mod discover;
mod error;
mod history;
mod http;
mod keychain;
mod login;
mod models;
mod openapi;
mod store;

use std::sync::Mutex;

use tauri::Manager;

/// Estado global de la app: la conexión SQLite tras un mutex.
pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            api::create_service,
            api::list_services,
            api::update_service,
            api::delete_service,
            api::create_environment,
            api::list_environments,
            api::update_environment,
            api::delete_environment,
            api::list_snapshots,
            api::import_service,
            api::get_service_spec,
            api::list_variables,
            api::upsert_variable,
            api::delete_variable,
            api::send_request,
            api::get_auth,
            api::set_auth_strategy,
            api::set_environment_secret,
            api::clear_environment_secret,
            api::authenticate,
            api::reauthenticate,
            api::forget_credentials,
            api::list_history,
            api::clear_history,
            api::generate_types,
            api::export_types,
            api::generate_client,
            api::export_client,
            api::diff_snapshots,
            api::create_saved_request,
            api::list_saved_requests,
            api::update_saved_request,
            api::delete_saved_request,
            api::discover_localhost,
            api::create_sequence,
            api::list_sequences,
            api::update_sequence,
            api::delete_sequence,
        ])
        .run(tauri::generate_context!())
        .expect("error al arrancar Nala");
}
