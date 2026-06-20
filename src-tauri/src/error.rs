use serde::{Serialize, Serializer};

/// Error unificado del backend. Se serializa como string para cruzar el puente
/// de Tauri y llegar al frontend como un `Error` legible.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("error de base de datos: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("error de keychain: {0}")]
    Keyring(#[from] keyring::Error),

    // Se usará en fases posteriores (validación, OpenAPI, HTTP).
    #[allow(dead_code)]
    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
