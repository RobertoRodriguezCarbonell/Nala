use std::time::Duration;

use serde_json::Value;

use crate::error::AppError;

/// Descarga el `openapi.json` desde `{base_url}{spec_path}` y lo parsea a JSON.
/// Devuelve errores legibles para los estados típicos (no responde / no es JSON).
pub async fn fetch_spec(base_url: &str, spec_path: &str) -> Result<Value, AppError> {
    let url = join_url(base_url, spec_path);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent(concat!("Nala/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| AppError::Http(e.to_string()))?;

    let resp = client.get(&url).send().await.map_err(|e| {
        if e.is_timeout() {
            AppError::Http("el servidor no respondió a tiempo".into())
        } else if e.is_connect() {
            AppError::Http(format!("no se pudo conectar con {url}"))
        } else {
            AppError::Http(e.to_string())
        }
    })?;

    let status = resp.status();
    if !status.is_success() {
        return Err(AppError::Http(format!(
            "el servidor respondió {} al pedir {}",
            status.as_u16(),
            url
        )));
    }

    let text = resp
        .text()
        .await
        .map_err(|e| AppError::Http(e.to_string()))?;

    serde_json::from_str(&text)
        .map_err(|_| AppError::Spec("la respuesta no es un JSON válido".into()))
}

/// Une base URL y ruta del spec evitando barras duplicadas o ausentes.
fn join_url(base: &str, path: &str) -> String {
    let base = base.trim_end_matches('/');
    if path.starts_with('/') {
        format!("{base}{path}")
    } else {
        format!("{base}/{path}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    /// Levanta un servidor HTTP mínimo que atiende una sola conexión.
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

    #[test]
    fn une_urls_sin_duplicar_barras() {
        assert_eq!(join_url("http://x:8000/", "/openapi.json"), "http://x:8000/openapi.json");
        assert_eq!(join_url("http://x:8000", "openapi.json"), "http://x:8000/openapi.json");
    }

    #[tokio::test]
    async fn descarga_y_parsea_el_spec() {
        let port = serve_once(r#"{"openapi":"3.1.0","info":{"title":"X","version":"1"},"paths":{}}"#);
        let spec = fetch_spec(&format!("http://127.0.0.1:{port}"), "/openapi.json")
            .await
            .unwrap();
        assert_eq!(spec["openapi"], "3.1.0");
        assert_eq!(spec["info"]["title"], "X");
    }
}
