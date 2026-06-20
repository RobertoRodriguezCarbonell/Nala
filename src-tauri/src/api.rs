//! Comandos Tauri de la Fase 2: CRUD de servicios/entornos e importación OpenAPI.

use serde_json::Value;
use tauri::State;

use crate::error::AppError;
use crate::models::{
    Environment, EnvironmentInput, HttpRequestInput, HttpResponse, ImportResult, Service,
    ServiceInput, SnapshotMeta, Variable, VariableInput,
};
use crate::openapi::{self, NormalizedSpec};
use crate::{http, store};
use crate::AppState;

// ---------- Servicios ----------

#[tauri::command]
pub fn create_service(state: State<AppState>, input: ServiceInput) -> Result<Service, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::create_service(&conn, &input)
}

#[tauri::command]
pub fn list_services(state: State<AppState>) -> Result<Vec<Service>, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::list_services(&conn)
}

#[tauri::command]
pub fn update_service(
    state: State<AppState>,
    id: i64,
    input: ServiceInput,
) -> Result<Service, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::update_service(&conn, id, &input)
}

#[tauri::command]
pub fn delete_service(state: State<AppState>, id: i64) -> Result<(), AppError> {
    let conn = state.db.lock().expect("db lock");
    store::delete_service(&conn, id)
}

// ---------- Entornos ----------

#[tauri::command]
pub fn create_environment(
    state: State<AppState>,
    input: EnvironmentInput,
) -> Result<Environment, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::create_environment(&conn, &input)
}

#[tauri::command]
pub fn list_environments(
    state: State<AppState>,
    service_id: i64,
) -> Result<Vec<Environment>, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::list_environments(&conn, service_id)
}

#[tauri::command]
pub fn update_environment(
    state: State<AppState>,
    id: i64,
    name: String,
    base_url: String,
) -> Result<Environment, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::update_environment(&conn, id, &name, &base_url)
}

#[tauri::command]
pub fn delete_environment(state: State<AppState>, id: i64) -> Result<(), AppError> {
    let conn = state.db.lock().expect("db lock");
    store::delete_environment(&conn, id)
}

// ---------- Snapshots / OpenAPI ----------

#[tauri::command]
pub fn list_snapshots(
    state: State<AppState>,
    service_id: i64,
) -> Result<Vec<SnapshotMeta>, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::list_snapshots(&conn, service_id)
}

/// Importa (o refresca) un servicio desde el entorno dado: descarga el spec,
/// lo normaliza, crea un snapshot y devuelve el modelo + el conteo de endpoints.
#[tauri::command]
pub async fn import_service(
    state: State<'_, AppState>,
    service_id: i64,
    environment_id: i64,
) -> Result<ImportResult, AppError> {
    // 1) Datos necesarios bajo lock (no se mantiene a través del await).
    let (spec_path, base_url) = {
        let conn = state.db.lock().expect("db lock");
        let service = store::get_service(&conn, service_id)?;
        let environment = store::get_environment(&conn, environment_id)?;
        if environment.service_id != service_id {
            return Err(AppError::NotFound(format!(
                "el entorno {environment_id} no pertenece al servicio {service_id}"
            )));
        }
        (service.spec_path, environment.base_url)
    };

    // 2) Fetch + normalización (sin lock).
    let raw = openapi::fetch_spec(&base_url, &spec_path).await?;
    let spec = openapi::normalize(&raw)?;
    let endpoint_count = spec.operations.len() as i64;
    let raw_str = serde_json::to_string(&raw).map_err(|e| AppError::Spec(e.to_string()))?;

    // 3) Persistir el snapshot bajo lock.
    let snapshot = {
        let conn = state.db.lock().expect("db lock");
        store::insert_snapshot(
            &conn,
            service_id,
            &raw_str,
            &spec.openapi_version,
            spec.title.as_deref(),
            spec.version.as_deref(),
            endpoint_count,
        )?
    };

    Ok(ImportResult { snapshot, spec })
}

/// Devuelve el spec normalizado del último snapshot de un servicio (si lo hay).
#[tauri::command]
pub fn get_service_spec(
    state: State<AppState>,
    service_id: i64,
) -> Result<Option<NormalizedSpec>, AppError> {
    let conn = state.db.lock().expect("db lock");
    match store::latest_raw_spec(&conn, service_id)? {
        Some(raw) => {
            let value: Value =
                serde_json::from_str(&raw).map_err(|e| AppError::Spec(e.to_string()))?;
            Ok(Some(openapi::normalize(&value)?))
        }
        None => Ok(None),
    }
}

// ---------- Variables ----------

#[tauri::command]
pub fn list_variables(
    state: State<AppState>,
    service_id: Option<i64>,
    environment_id: Option<i64>,
) -> Result<Vec<Variable>, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::list_variables(&conn, service_id, environment_id)
}

#[tauri::command]
pub fn upsert_variable(state: State<AppState>, input: VariableInput) -> Result<Variable, AppError> {
    let conn = state.db.lock().expect("db lock");
    store::upsert_variable(&conn, &input)
}

#[tauri::command]
pub fn delete_variable(state: State<AppState>, id: i64) -> Result<(), AppError> {
    let conn = state.db.lock().expect("db lock");
    store::delete_variable(&conn, id)
}

// ---------- Envío HTTP ----------

/// Ejecuta una petición HTTP (sin auth en F3) y devuelve la respuesta.
#[tauri::command]
pub async fn send_request(input: HttpRequestInput) -> Result<HttpResponse, AppError> {
    http::send_request(input).await
}
