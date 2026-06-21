use serde::{Deserialize, Serialize};

/// Servicio: identidad lógica de una API. No guarda URL (vive en el entorno).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    pub id: i64,
    pub name: String,
    pub group_name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub spec_path: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Datos de entrada para crear/editar un servicio.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInput {
    pub name: String,
    pub group_name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    #[serde(default = "default_spec_path")]
    pub spec_path: String,
}

fn default_spec_path() -> String {
    "/openapi.json".to_string()
}

/// Entorno: destino concreto de un servicio. Aporta la base URL.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub id: i64,
    pub service_id: i64,
    pub name: String,
    pub base_url: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentInput {
    pub service_id: i64,
    pub name: String,
    pub base_url: String,
}

/// Metadatos de un snapshot (sin el raw_spec, que es voluminoso).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotMeta {
    pub id: i64,
    pub service_id: i64,
    pub openapi_version: String,
    pub api_title: Option<String>,
    pub api_version: Option<String>,
    pub endpoint_count: i64,
    pub fetched_at: String,
}

/// Resultado de importar/refrescar: el spec normalizado + el snapshot creado.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub snapshot: SnapshotMeta,
    pub spec: crate::openapi::NormalizedSpec,
}

/// Variable de plantilla `{{var}}` con ámbito (global / service / environment).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub id: i64,
    pub scope: String,
    pub scope_id: Option<i64>,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VariableInput {
    pub scope: String,
    pub scope_id: Option<i64>,
    pub key: String,
    pub value: String,
    #[serde(default)]
    pub is_secret: bool,
}

/// Par nombre/valor para cabeceras de la petición y de la respuesta.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Header {
    pub name: String,
    pub value: String,
}

/// Contexto para que Rust inyecte la auth del servicio/entorno al enviar.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthContext {
    pub service_id: i64,
    pub environment_id: i64,
}

/// Contexto de logging: a qué servicio/entorno pertenece la petición (historial).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestMeta {
    pub service_id: i64,
    pub environment_id: Option<i64>,
    #[serde(default)]
    pub skip_history: bool,
}

/// Petición HTTP ya resuelta (URL e interpolación hechas en el frontend).
/// `auth` es opcional: si llega, Rust inyecta la credencial antes de enviar.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestInput {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<Header>,
    pub body: Option<String>,
    #[serde(default)]
    pub auth: Option<AuthContext>,
    #[serde(default)]
    pub meta: Option<RequestMeta>,
}

/// Respuesta HTTP con métricas para el visor.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: Vec<Header>,
    pub body: String,
    pub time_ms: u64,
    pub size_bytes: u64,
    pub content_type: Option<String>,
}

/// Estado de auth que ve el frontend: estrategia del servicio + estados del
/// entorno consultado. Nunca incluye el secreto/token/credenciales en claro.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatus {
    pub kind: String,
    pub config: serde_json::Value,
    pub has_secret: bool,
    pub token_state: String, // "none" | "valid" | "expired"
    pub remember_credentials: bool,
    pub has_credentials: bool,
    pub expires_at: Option<i64>,
}

/// Entrada de historial tal como la lee el frontend (cabeceras ya parseadas).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: i64,
    pub service_id: i64,
    pub environment_id: Option<i64>,
    pub method: String,
    pub url: String,
    pub request_headers: Vec<Header>,
    pub request_body: Option<String>,
    pub status: Option<i64>,
    pub status_text: String,
    pub time_ms: i64,
    pub size_bytes: i64,
    pub content_type: Option<String>,
    pub response_headers: Vec<Header>,
    pub response_body: String,
    pub error: Option<String>,
    pub created_at: String,
}

/// Petición guardada: snapshot de los inputs de un constructor (draft opaco) +
/// flags de smoke. Se ejecuta contra el entorno activo.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedRequest {
    pub id: i64,
    pub service_id: i64,
    pub name: String,
    pub method: String,
    pub path: String,
    pub operation_id: Option<String>,
    pub draft_json: String,
    pub is_smoke: bool,
    pub expected_status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedRequestInput {
    pub service_id: i64,
    pub name: String,
    pub method: String,
    pub path: String,
    pub operation_id: Option<String>,
    pub draft_json: String,
    pub is_smoke: bool,
    pub expected_status: String,
}

/// Entrada de historial lista para insertar (sin id/created_at). Las cabeceras
/// van serializadas a JSON; la auth ya viene redactada.
pub struct NewHistoryEntry {
    pub service_id: i64,
    pub environment_id: Option<i64>,
    pub method: String,
    pub url: String,
    pub request_headers: String,
    pub request_body: Option<String>,
    pub status: Option<i64>,
    pub status_text: String,
    pub time_ms: i64,
    pub size_bytes: i64,
    pub content_type: Option<String>,
    pub response_headers: String,
    pub response_body: String,
    pub error: Option<String>,
}
