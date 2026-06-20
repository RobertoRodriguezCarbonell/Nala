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
