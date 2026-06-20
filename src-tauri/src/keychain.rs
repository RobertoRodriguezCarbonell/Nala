use keyring::Entry;
use rand::RngCore;

use crate::error::AppError;

const SERVICE: &str = "Nala";
const KEY_USER: &str = "field-encryption-key";

/// Asegura que existe la clave de cifrado de campos en el Credential Manager de
/// Windows. La crea (32 bytes aleatorios) en el primer arranque. No devuelve la
/// clave: solo garantiza su presencia.
pub fn ensure_key() -> Result<(), AppError> {
    let entry = Entry::new(SERVICE, KEY_USER)?;
    match entry.get_password() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => {
            let mut bytes = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut bytes);
            entry.set_password(&hex_encode(&bytes))?;
            Ok(())
        }
        Err(err) => Err(err.into()),
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

/// Lee la clave de cifrado de 32 bytes del Credential Manager (la crea si falta).
pub fn get_key() -> Result<[u8; 32], AppError> {
    ensure_key()?;
    let entry = Entry::new(SERVICE, KEY_USER)?;
    let hex = entry.get_password()?;
    let bytes = hex_decode(&hex)
        .ok_or_else(|| AppError::Other("clave de cifrado corrupta en el keychain".into()))?;
    bytes
        .try_into()
        .map_err(|_| AppError::Other("la clave de cifrado no mide 32 bytes".into()))
}

fn hex_decode(s: &str) -> Option<Vec<u8>> {
    if s.len() % 2 != 0 {
        return None;
    }
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).ok())
        .collect()
}
