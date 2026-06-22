//! Descubrimiento de servicios FastAPI en localhost: sondea una lista fija de
//! puertos pidiendo `/openapi.json` y devuelve los que respondan un OpenAPI válido.

use std::time::Duration;

use serde::Serialize;
use serde_json::Value;

use crate::openapi;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Discovered {
    pub port: u16,
    pub base_url: String,
    pub spec_path: String,
    pub title: Option<String>,
    pub version: Option<String>,
    pub endpoint_count: i64,
}

const COMMON_PORTS: &[u16] = &[8000, 8001, 8002, 8080, 5000, 5001, 3000, 8888, 9000];
const SPEC_PATH: &str = "/openapi.json";

/// Sondea un puerto. Cualquier fallo (conexión, timeout, no-2xx, no-JSON, sin
/// campo `openapi`) devuelve `None`: el descubrimiento es best-effort.
async fn probe_port(client: &reqwest::Client, port: u16) -> Option<Discovered> {
    let base_url = format!("http://127.0.0.1:{port}");
    let resp = client.get(format!("{base_url}{SPEC_PATH}")).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let text = resp.text().await.ok()?;
    let value: Value = serde_json::from_str(&text).ok()?;
    if value.get("openapi").is_none() {
        return None;
    }
    let title = value.pointer("/info/title").and_then(|v| v.as_str()).map(String::from);
    let version = value.pointer("/info/version").and_then(|v| v.as_str()).map(String::from);
    let endpoint_count = openapi::normalize(&value).map(|s| s.operations.len() as i64).unwrap_or(0);
    Some(Discovered {
        port,
        base_url,
        spec_path: SPEC_PATH.to_string(),
        title,
        version,
        endpoint_count,
    })
}

/// Sondea todos los puertos comunes (secuencial) y recoge los servicios hallados.
pub async fn discover() -> Vec<Discovered> {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_millis(400))
        .user_agent(concat!("Nala/", env!("CARGO_PKG_VERSION")))
        .build()
    {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };
    let mut found = Vec::new();
    for &port in COMMON_PORTS {
        if let Some(d) = probe_port(&client, port).await {
            found.push(d);
        }
    }
    found
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    /// Servidor HTTP mínimo de una sola conexión (igual patrón que en fetch.rs).
    fn serve_once(body: &'static str) -> u16 {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        std::thread::spawn(move || {
            if let Ok((mut stream, _)) = listener.accept() {
                let mut buf = [0u8; 2048];
                let _ = stream.read(&mut buf);
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(resp.as_bytes());
                let _ = stream.flush();
            }
        });
        port
    }

    fn client() -> reqwest::Client {
        reqwest::Client::builder().timeout(Duration::from_secs(2)).build().unwrap()
    }

    #[tokio::test]
    async fn detecta_un_openapi_valido() {
        let port = serve_once(r#"{"openapi":"3.1.0","info":{"title":"Mesero","version":"2.0"},"paths":{"/a":{"get":{}},"/b":{"post":{}}}}"#);
        let d = probe_port(&client(), port).await.expect("debería detectar el servicio");
        assert_eq!(d.title.as_deref(), Some("Mesero"));
        assert_eq!(d.version.as_deref(), Some("2.0"));
        assert_eq!(d.endpoint_count, 2);
        assert_eq!(d.base_url, format!("http://127.0.0.1:{port}"));
        assert_eq!(d.spec_path, "/openapi.json");
    }

    #[tokio::test]
    async fn ignora_json_sin_campo_openapi() {
        let port = serve_once(r#"{"hello":"world"}"#);
        assert!(probe_port(&client(), port).await.is_none());
    }

    #[tokio::test]
    async fn puerto_sin_servidor_da_none() {
        // Reservamos un puerto efímero y lo soltamos: nada escucha ahí.
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);
        assert!(probe_port(&client(), port).await.is_none());
    }
}
