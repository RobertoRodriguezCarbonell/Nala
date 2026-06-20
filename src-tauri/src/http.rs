use std::time::{Duration, Instant};

use crate::error::AppError;
use crate::models::{Header, HttpRequestInput, HttpResponse};

/// Ejecuta una petición HTTP ya resuelta y devuelve la respuesta con métricas.
/// Se hace desde Rust (no desde el webview) para evitar CORS y controlar timeouts.
pub async fn send_request(input: HttpRequestInput) -> Result<HttpResponse, AppError> {
    let method = reqwest::Method::from_bytes(input.method.to_uppercase().as_bytes())
        .map_err(|_| AppError::Http(format!("método no válido: {}", input.method)))?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .user_agent(concat!("Nala/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| AppError::Http(e.to_string()))?;

    let mut req = client.request(method, &input.url);
    for h in &input.headers {
        if !h.name.trim().is_empty() {
            req = req.header(&h.name, &h.value);
        }
    }
    if let Some(body) = input.body {
        req = req.body(body);
    }

    let started = Instant::now();
    let resp = req.send().await.map_err(|e| {
        if e.is_timeout() {
            AppError::Http("la petición superó el tiempo de espera".into())
        } else if e.is_connect() {
            AppError::Http("no se pudo conectar con el servidor".into())
        } else if e.is_request() {
            AppError::Http(format!("petición no válida: {e}"))
        } else {
            AppError::Http(e.to_string())
        }
    })?;

    let status = resp.status();
    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(String::from);

    let headers: Vec<Header> = resp
        .headers()
        .iter()
        .map(|(k, v)| Header {
            name: k.as_str().to_string(),
            value: v.to_str().unwrap_or("").to_string(),
        })
        .collect();

    let bytes = resp.bytes().await.map_err(|e| AppError::Http(e.to_string()))?;
    let time_ms = started.elapsed().as_millis() as u64;
    let size_bytes = bytes.len() as u64;
    let body = String::from_utf8_lossy(&bytes).into_owned();

    Ok(HttpResponse {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers,
        body,
        time_ms,
        size_bytes,
        content_type,
    })
}
