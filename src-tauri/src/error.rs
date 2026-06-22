use serde::{Serialize, Serializer};

/// Error unificado del backend. Se serializa como string para cruzar el puente
/// de Tauri y llegar al frontend como un `Error` legible.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("error de base de datos: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("error de keychain: {0}")]
    Keyring(#[from] keyring::Error),

    #[error("error de red: {0}")]
    Http(String),

    #[error("OpenAPI no válido: {0}")]
    Spec(String),

    #[error("no encontrado: {0}")]
    NotFound(String),

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
