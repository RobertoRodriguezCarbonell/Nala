//! Flujo de login: funciones puras de extracción de token, caducidad y
//! construcción del cuerpo de la petición de login. La orquestación (enviar,
//! cifrar, persistir) vive en `api.rs`.

use std::time::{SystemTime, UNIX_EPOCH};

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde_json::Value;

use crate::auth::urlencode;

/// "Ahora" en epoch unix (segundos).
#[allow(dead_code)] // se usa al cablear el login (Task 2/3)
pub fn now_epoch() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Extrae el token de la respuesta navegando un `path` punteado ("data.token").
/// `None` si falta algún tramo o el valor no es string.
#[allow(dead_code)] // se usa al cablear el login (Task 3)
pub fn extract_token(value: &Value, path: &str) -> Option<String> {
    let mut cur = value;
    for seg in path.split('.') {
        cur = cur.get(seg)?;
    }
    cur.as_str().map(|s| s.to_string())
}

/// Caducidad a partir de `expires_in` (segundos) de la respuesta → epoch.
#[allow(dead_code)] // se usa al cablear el login (Task 3)
pub fn expiry_from_response(value: &Value, now: i64) -> Option<i64> {
    value
        .get("expires_in")
        .and_then(|v| v.as_i64())
        .map(|secs| now + secs)
}

/// Caducidad a partir del claim `exp` de un JWT (decodifica el payload).
/// `None` si el token no tiene 3 segmentos o no trae `exp`.
#[allow(dead_code)] // se usa al cablear el login (Task 3)
pub fn expiry_from_jwt(token: &str) -> Option<i64> {
    let mut parts = token.split('.');
    let _header = parts.next()?;
    let payload_b64 = parts.next()?;
    parts.next()?; // un JWT tiene firma; si no, no lo tratamos como JWT
    if parts.next().is_some() {
        return None; // más de 3 segmentos: no es un JWT
    }
    let bytes = URL_SAFE_NO_PAD.decode(payload_b64).ok()?;
    let payload: Value = serde_json::from_slice(&bytes).ok()?;
    payload.get("exp").and_then(|v| v.as_i64())
}

/// Construye `(body, content_type)` para la petición de login.
#[allow(dead_code)] // se usa al cablear el login (Task 3)
pub fn build_login_body(
    content_type: &str,
    user_field: &str,
    pass_field: &str,
    user: &str,
    pass: &str,
) -> (String, String) {
    if content_type == "json" {
        let body = serde_json::json!({ user_field: user, pass_field: pass }).to_string();
        (body, "application/json".to_string())
    } else {
        let body = format!(
            "{}={}&{}={}",
            urlencode(user_field),
            urlencode(user),
            urlencode(pass_field),
            urlencode(pass),
        );
        (body, "application/x-www-form-urlencoded".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn extract_token_top_level_and_dotted() {
        assert_eq!(
            extract_token(&json!({"access_token": "t"}), "access_token"),
            Some("t".to_string())
        );
        assert_eq!(
            extract_token(&json!({"data": {"token": "t2"}}), "data.token"),
            Some("t2".to_string())
        );
    }

    #[test]
    fn extract_token_missing_or_not_string() {
        assert_eq!(extract_token(&json!({"a": 1}), "b"), None);
        assert_eq!(extract_token(&json!({"a": 1}), "a"), None); // no es string
    }

    #[test]
    fn expiry_from_response_uses_expires_in() {
        assert_eq!(expiry_from_response(&json!({"expires_in": 3600}), 1000), Some(4600));
        assert_eq!(expiry_from_response(&json!({"token_type": "bearer"}), 1000), None);
    }

    #[test]
    fn expiry_from_jwt_reads_exp() {
        // payload {"exp": 9999999999} en base64url sin padding
        let payload = URL_SAFE_NO_PAD.encode(br#"{"exp":9999999999}"#);
        let jwt = format!("aaa.{payload}.bbb");
        assert_eq!(expiry_from_jwt(&jwt), Some(9999999999));
    }

    #[test]
    fn expiry_from_jwt_rejects_non_jwt() {
        assert_eq!(expiry_from_jwt("no-es-un-jwt"), None);
        assert_eq!(expiry_from_jwt("solo.dos"), None); // sin firma
        assert_eq!(expiry_from_jwt("a.b.c.d"), None); // 4 segmentos
    }

    #[test]
    fn build_login_body_form_and_json() {
        let (body, ct) = build_login_body("form", "username", "password", "demo", "d e");
        assert_eq!(ct, "application/x-www-form-urlencoded");
        assert_eq!(body, "username=demo&password=d%20e");

        let (body, ct) = build_login_body("json", "email", "password", "a@b.com", "p");
        assert_eq!(ct, "application/json");
        let v: Value = serde_json::from_str(&body).unwrap();
        assert_eq!(v["email"], "a@b.com");
        assert_eq!(v["password"], "p");
    }
}
