//! Cifrado de campos sensibles (AES-256-GCM). La clave de 32 bytes vive en el
//! Credential Manager (ver `keychain.rs`); aquí solo se usa para cifrar/descifrar.

use std::sync::OnceLock;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use rand::RngCore;

use crate::error::AppError;
use crate::keychain;

static KEY: OnceLock<[u8; 32]> = OnceLock::new();

fn key() -> Result<&'static [u8; 32], AppError> {
    if let Some(k) = KEY.get() {
        return Ok(k);
    }
    let k = keychain::get_key()?;
    Ok(KEY.get_or_init(|| k))
}

/// Cifra `plaintext` y devuelve `base64(nonce(12) || ciphertext)`.
/// Se usa al guardar secretos de auth (ver `api::set_environment_secret`).
#[allow(dead_code)]
pub fn encrypt(plaintext: &str) -> Result<String, AppError> {
    encrypt_with_key(key()?, plaintext)
}

/// Descifra un valor producido por `encrypt`. Se usa al inyectar auth en el envío.
#[allow(dead_code)]
pub fn decrypt(stored: &str) -> Result<String, AppError> {
    decrypt_with_key(key()?, stored)
}

fn encrypt_with_key(key: &[u8; 32], plaintext: &str) -> Result<String, AppError> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|_| AppError::Other("fallo al cifrar".into()))?;
    let mut blob = Vec::with_capacity(12 + ciphertext.len());
    blob.extend_from_slice(&nonce_bytes);
    blob.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(blob))
}

fn decrypt_with_key(key: &[u8; 32], stored: &str) -> Result<String, AppError> {
    let blob = STANDARD
        .decode(stored)
        .map_err(|_| AppError::Other("texto cifrado no válido (base64)".into()))?;
    if blob.len() < 12 {
        return Err(AppError::Other("texto cifrado demasiado corto".into()));
    }
    let (nonce_bytes, ciphertext) = blob.split_at(12);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let plaintext = cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ciphertext)
        .map_err(|_| AppError::Other("fallo al descifrar".into()))?;
    String::from_utf8(plaintext)
        .map_err(|_| AppError::Other("texto descifrado no es UTF-8".into()))
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_KEY: [u8; 32] = [7u8; 32];

    #[test]
    fn round_trip() {
        let enc = encrypt_with_key(&TEST_KEY, "tok_demo_123").unwrap();
        assert_eq!(decrypt_with_key(&TEST_KEY, &enc).unwrap(), "tok_demo_123");
    }

    #[test]
    fn nonce_makes_ciphertexts_differ() {
        let a = encrypt_with_key(&TEST_KEY, "mismo").unwrap();
        let b = encrypt_with_key(&TEST_KEY, "mismo").unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn tampered_fails() {
        let enc = encrypt_with_key(&TEST_KEY, "secreto").unwrap();
        let mut blob = STANDARD.decode(&enc).unwrap();
        let n = blob.len();
        blob[n - 1] ^= 0xff; // corrompe el tag GCM
        let tampered = STANDARD.encode(blob);
        assert!(decrypt_with_key(&TEST_KEY, &tampered).is_err());
    }
}
