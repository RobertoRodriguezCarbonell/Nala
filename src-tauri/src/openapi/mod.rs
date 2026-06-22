//! Motor OpenAPI: fetch del spec, parseo y normalización a un modelo digerido
//! e independiente de versión (3.0 / 3.1) que el frontend solo tiene que pintar.

mod codegen;
mod diff;
mod fetch;
mod normalize;

pub use codegen::{generate_client, generate_typescript};
pub use diff::{diff_specs, SchemaDiff, SnapshotRef};
pub use fetch::fetch_spec;
pub use normalize::normalize;

use serde::Serialize;
use serde_json::Value;

/// Spec normalizado: lo que consume el frontend (sidebar y, en Fase 3, el form).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedSpec {
    pub openapi_version: String,
    pub title: Option<String>,
    pub version: Option<String>,
    pub operations: Vec<Operation>,
}

/// Una operación = un método + una ruta.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Operation {
    pub method: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    pub deprecated: bool,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub parameters: Vec<Param>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_body: Option<RequestBody>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub responses: Vec<ResponseDef>,
}

/// Parámetro de path / query / header / cookie.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Param {
    pub name: String,
    /// path | query | header | cookie
    pub location: String,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub schema: Schema,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestBody {
    pub required: bool,
    pub content_type: String,
    pub schema: Schema,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseDef {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<Schema>,
}

/// Esquema normalizado e independiente de versión. `types` siempre es una lista
/// (3.1 admite `type: [..]`; en 3.0 reducimos un único tipo + `nullable`).
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Schema {
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub types: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Nombre del modelo cuando viene de un `$ref` (`#/components/schemas/X`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ref_name: Option<String>,
    pub nullable: bool,
    /// `true` si el `$ref` es circular y se cortó la expansión.
    pub circular: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enum_values: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub example: Option<Value>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub properties: Vec<Property>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub required: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Box<Schema>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maximum: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_length: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_length: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pattern: Option<String>,
    /// Variantes sin reducir (uniones que no son simplemente "X o null").
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub any_of: Vec<Schema>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Property {
    pub name: String,
    pub required: bool,
    pub schema: Schema,
}
