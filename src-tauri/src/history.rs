//! Historial: redacción de la auth en el request registrado y armado de las
//! entradas a persistir. Lógica pura (sin BD ni red).

use crate::auth::Injection;
use crate::models::{Header, HttpRequestInput, HttpResponse, NewHistoryEntry, RequestMeta};

/// Marcador de redacción de secretos en el historial.
pub const REDACTED: &str = "••••";

/// Request final con la auth redactada, listo para guardar.
pub struct RequestSnapshot {
    pub method: String,
    pub url: String,
    pub headers: Vec<Header>,
    pub body: Option<String>,
}

/// Redacta la auth: la cabecera/query inyectada y cualquier `Authorization`
/// pasan a `••••`; el resto queda intacto.
#[allow(dead_code)] // se usa al cablear el logging (Task 3)
pub fn redact_request(input: &HttpRequestInput, injection: &Injection) -> RequestSnapshot {
    let injected_header = match injection {
        Injection::Header { name, .. } => Some(name.to_ascii_lowercase()),
        _ => None,
    };
    let headers = input
        .headers
        .iter()
        .map(|h| {
            let lower = h.name.to_ascii_lowercase();
            let redact = lower == "authorization" || injected_header.as_deref() == Some(lower.as_str());
            Header {
                name: h.name.clone(),
                value: if redact { REDACTED.to_string() } else { h.value.clone() },
            }
        })
        .collect();
    let url = match injection {
        Injection::Query { name, .. } => redact_query_param(&input.url, name),
        _ => input.url.clone(),
    };
    RequestSnapshot {
        method: input.method.clone(),
        url,
        headers,
        body: input.body.clone(),
    }
}

fn redact_query_param(url: &str, name: &str) -> String {
    let (base, query) = match url.split_once('?') {
        Some(pair) => pair,
        None => return url.to_string(),
    };
    let redacted: Vec<String> = query
        .split('&')
        .map(|pair| match pair.split_once('=') {
            Some((k, _)) if k == name => format!("{k}={REDACTED}"),
            _ => pair.to_string(),
        })
        .collect();
    format!("{base}?{}", redacted.join("&"))
}

fn headers_json(headers: &[Header]) -> String {
    serde_json::to_string(headers).unwrap_or_else(|_| "[]".to_string())
}

/// Arma la entrada de una respuesta recibida.
#[allow(dead_code)] // se usa al cablear el logging (Task 3)
pub fn entry_from_response(
    meta: &RequestMeta,
    req: &RequestSnapshot,
    resp: &HttpResponse,
) -> NewHistoryEntry {
    NewHistoryEntry {
        service_id: meta.service_id,
        environment_id: meta.environment_id,
        method: req.method.clone(),
        url: req.url.clone(),
        request_headers: headers_json(&req.headers),
        request_body: req.body.clone(),
        status: Some(resp.status as i64),
        status_text: resp.status_text.clone(),
        time_ms: resp.time_ms as i64,
        size_bytes: resp.size_bytes as i64,
        content_type: resp.content_type.clone(),
        response_headers: headers_json(&resp.headers),
        response_body: resp.body.clone(),
        error: None,
    }
}

/// Arma la entrada de un fallo de red (sin respuesta).
#[allow(dead_code)] // se usa al cablear el logging (Task 3)
pub fn entry_from_error(meta: &RequestMeta, req: &RequestSnapshot, error: &str) -> NewHistoryEntry {
    NewHistoryEntry {
        service_id: meta.service_id,
        environment_id: meta.environment_id,
        method: req.method.clone(),
        url: req.url.clone(),
        request_headers: headers_json(&req.headers),
        request_body: req.body.clone(),
        status: None,
        status_text: String::new(),
        time_ms: 0,
        size_bytes: 0,
        content_type: None,
        response_headers: "[]".to_string(),
        response_body: String::new(),
        error: Some(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(url: &str, headers: &[(&str, &str)]) -> HttpRequestInput {
        HttpRequestInput {
            method: "GET".into(),
            url: url.into(),
            headers: headers
                .iter()
                .map(|(n, v)| Header { name: (*n).into(), value: (*v).into() })
                .collect(),
            body: Some("b".into()),
            auth: None,
            meta: None,
        }
    }

    #[test]
    fn redacts_authorization_header_always() {
        let inp = input("http://x", &[("Authorization", "Bearer secreto"), ("Accept", "application/json")]);
        let snap = redact_request(&inp, &Injection::None);
        assert_eq!(snap.headers[0].value, REDACTED);
        assert_eq!(snap.headers[1].value, "application/json");
        assert_eq!(snap.body.as_deref(), Some("b"));
    }

    #[test]
    fn redacts_injected_apikey_header() {
        let inp = input("http://x", &[("X-API-Key", "k123")]);
        let inj = Injection::Header { name: "X-API-Key".into(), value: "k123".into() };
        let snap = redact_request(&inp, &inj);
        assert_eq!(snap.headers[0].value, REDACTED);
    }

    #[test]
    fn redacts_injected_query_param() {
        let inp = input("http://x/r?api_key=k123&page=2", &[]);
        let inj = Injection::Query { name: "api_key".into(), value: "k123".into() };
        let snap = redact_request(&inp, &inj);
        assert_eq!(snap.url, "http://x/r?api_key=••••&page=2");
    }

    #[test]
    fn leaves_non_auth_untouched() {
        let inp = input("http://x?page=2", &[("Accept", "*/*")]);
        let snap = redact_request(&inp, &Injection::None);
        assert_eq!(snap.url, "http://x?page=2");
        assert_eq!(snap.headers[0].value, "*/*");
    }
}
