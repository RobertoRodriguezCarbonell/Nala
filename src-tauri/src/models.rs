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

/// Petición HTTP ya resuelta (URL e interpolación hechas en el frontend en F3).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestInput {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<Header>,
    pub body: Option<String>,
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
