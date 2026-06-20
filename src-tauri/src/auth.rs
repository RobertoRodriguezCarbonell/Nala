//! Resolución de autenticación: a partir de la estrategia del servicio y el
//! secreto del entorno (ya descifrado), calcula qué inyectar en la petición.
//! Lógica pura, sin BD ni red.

use serde_json::Value;

use crate::models::{Header, HttpRequestInput};

/// Qué añadir a la petición para autenticar.
#[derive(Debug, Clone, PartialEq)]
pub enum Injection {
    None,
    Header { name: String, value: String },
    Query { name: String, value: String },
}

/// Calcula la inyección. Sin secreto (o vacío) → `None` (se manda sin auth).
pub fn resolve(kind: &str, config: &str, secret: Option<&str>) -> Injection {
    let secret = match secret {
        Some(s) if !s.is_empty() => s,
        _ => return Injection::None,
    };
    match kind {
        "bearer" => Injection::Header {
            name: "Authorization".to_string(),
            value: format!("Bearer {secret}"),
        },
        "apiKey" => {
            let cfg: Value = serde_json::from_str(config).unwrap_or(Value::Null);
            let name = cfg
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            if name.is_empty() {
                return Injection::None;
            }
            let location = cfg.get("in").and_then(|v| v.as_str()).unwrap_or("header");
            if location == "query" {
                Injection::Query { name, value: secret.to_string() }
            } else {
                Injection::Header { name, value: secret.to_string() }
            }
        }
        _ => Injection::None,
    }
}

/// Inyección del token de login cacheado: `Authorization: <scheme> <token>`
/// (scheme por defecto `Bearer`).
pub fn resolve_login(scheme: &str, token: &str) -> Injection {
    let scheme = if scheme.is_empty() { "Bearer" } else { scheme };
    Injection::Header {
        name: "Authorization".to_string(),
        value: format!("{scheme} {token}"),
    }
}

/// Aplica la inyección a la petición. No pisa un `Authorization` puesto a mano.
pub fn apply(input: &mut HttpRequestInput, injection: Injection) {
    match injection {
        Injection::None => {}
        Injection::Header { name, value } => {
            let exists = input
                .headers
                .iter()
                .any(|h| h.name.eq_ignore_ascii_case(&name));
            if !exists {
                input.headers.push(Header { name, value });
            }
        }
        Injection::Query { name, value } => {
            let sep = if input.url.contains('?') { '&' } else { '?' };
            input.url = format!("{}{}{}={}", input.url, sep, urlencode(&name), urlencode(&value));
        }
    }
}

/// Codificación porcentual mínima (RFC 3986, sin reservados).
pub(crate) fn urlencode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn req(url: &str, headers: Vec<Header>) -> HttpRequestInput {
        HttpRequestInput {
            method: "GET".into(),
            url: url.into(),
            headers,
            body: None,
            auth: None,
            meta: None,
        }
    }

    #[test]
    fn bearer_resolves_to_authorization_header() {
        assert_eq!(
            resolve("bearer", "{}", Some("tok_demo_123")),
            Injection::Header {
                name: "Authorization".into(),
                value: "Bearer tok_demo_123".into(),
            }
        );
    }

    #[test]
    fn apikey_header() {
        assert_eq!(
            resolve("apiKey", r#"{"name":"X-API-Key","in":"header"}"#, Some("k123")),
            Injection::Header { name: "X-API-Key".into(), value: "k123".into() }
        );
    }

    #[test]
    fn apikey_query() {
        assert_eq!(
            resolve("apiKey", r#"{"name":"api_key","in":"query"}"#, Some("k 1")),
            Injection::Query { name: "api_key".into(), value: "k 1".into() }
        );
    }

    #[test]
    fn no_secret_means_none() {
        assert_eq!(resolve("bearer", "{}", None), Injection::None);
        assert_eq!(resolve("bearer", "{}", Some("")), Injection::None);
    }

    #[test]
    fn apply_query_appends_with_correct_separator() {
        let mut input = req("http://x/reservas", vec![]);
        apply(&mut input, Injection::Query { name: "api_key".into(), value: "k 1".into() });
        assert_eq!(input.url, "http://x/reservas?api_key=k%201");
        apply(&mut input, Injection::Query { name: "b".into(), value: "2".into() });
        assert_eq!(input.url, "http://x/reservas?api_key=k%201&b=2");
    }

    #[test]
    fn apply_header_does_not_override_manual_auth() {
        let mut input = req(
            "http://x",
            vec![Header { name: "authorization".into(), value: "Bearer manual".into() }],
        );
        apply(
            &mut input,
            Injection::Header { name: "Authorization".into(), value: "Bearer auto".into() },
        );
        assert_eq!(input.headers.len(), 1);
        assert_eq!(input.headers[0].value, "Bearer manual");
    }

    #[test]
    fn resolve_login_uses_scheme_default_bearer() {
        assert_eq!(
            resolve_login("", "tok"),
            Injection::Header { name: "Authorization".into(), value: "Bearer tok".into() }
        );
        assert_eq!(
            resolve_login("Token", "tok"),
            Injection::Header { name: "Authorization".into(), value: "Token tok".into() }
        );
    }
}
