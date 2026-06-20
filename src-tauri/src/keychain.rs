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
