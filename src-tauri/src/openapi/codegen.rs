//! Generación de tipos TypeScript desde `components/schemas` de un spec OpenAPI.
//!
//! Recorrido propio e independiente de `normalize`: a diferencia del
//! normalizador (que inlina los `$ref` para pintar formularios), aquí los `$ref`
//! se emiten como **referencias por nombre**, que es lo que da tipos limpios e
//! idiomáticos y resuelve los ciclos de forma natural.

use serde_json::{Map, Value};

/// Emite el `.ts` de los modelos (`components/schemas`) de un spec OpenAPI 3.0/3.1.
pub fn generate_typescript(spec: &Value) -> String {
    let title = spec.pointer("/info/title").and_then(|v| v.as_str()).unwrap_or("API");
    let version = spec.pointer("/info/version").and_then(|v| v.as_str()).unwrap_or("");
    let header = format!("// Tipos generados por Nala desde {title} {version}");
    let mut out = String::new();
    out.push_str(header.trim_end());
    out.push('\n');
    out.push_str(&emit_models(spec));
    out
}

/// Bloque de modelos (sin la cabecera de archivo). Reutilizado por el cliente.
fn emit_models(spec: &Value) -> String {
    let mut out = String::new();
    out.push_str("// Modelos de components/schemas — no editar a mano.\n");
    match spec.pointer("/components/schemas").and_then(|v| v.as_object()) {
        Some(map) if !map.is_empty() => {
            for (name, schema) in map {
                out.push('\n');
                out.push_str(&emit_named(name, schema));
            }
        }
        _ => out.push_str("\n// (sin modelos)\n"),
    }
    out
}

const CLIENT_METHODS: &[&str] = &["get", "post", "put", "patch", "delete", "head", "options", "trace"];

const CLIENT_RUNTIME: &str = r#"
export class ApiError extends Error {
  constructor(public status: number, public statusText: string, public body: unknown) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

function buildQuery(q?: Record<string, unknown>): string {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null) p.append(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  cfg: ClientConfig,
  method: string,
  path: string,
  opts: { query?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  const f = cfg.fetch ?? fetch;
  const headers: Record<string, string> = { ...cfg.headers };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await f(cfg.baseUrl + path + buildQuery(opts.query), { method, headers, body });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new ApiError(res.status, res.statusText, parsed);
  return parsed as T;
}
"#;

/// Parámetro de operación ya normalizado a lo que necesita el cliente.
struct ClientParam {
    name: String,
    location: String,
    required: bool,
    schema: Value,
}

/// Emite el cliente TS completo (modelos + runtime + createClient).
pub fn generate_client(spec: &Value) -> String {
    let title = spec.pointer("/info/title").and_then(|v| v.as_str()).unwrap_or("API");
    let version = spec.pointer("/info/version").and_then(|v| v.as_str()).unwrap_or("");
    let header = format!("// Cliente TS generado por Nala desde {title} {version}");

    let mut out = String::new();
    out.push_str(header.trim_end());
    out.push('\n');
    out.push_str(&emit_models(spec));
    out.push_str(CLIENT_RUNTIME);
    out.push('\n');
    out.push_str(&emit_create_client(spec));
    out
}

fn emit_create_client(spec: &Value) -> String {
    let mut out = String::new();
    out.push_str("export function createClient(config: ClientConfig) {\n");
    out.push_str("  return {\n");
    if let Some(paths) = spec.pointer("/paths").and_then(|v| v.as_object()) {
        for (path, item) in paths {
            for &m in CLIENT_METHODS {
                if let Some(op) = item.get(m) {
                    out.push_str(&emit_method(path, m, op, item));
                }
            }
        }
    }
    out.push_str("  };\n");
    out.push_str("}\n");
    out
}

/// Mezcla los parámetros del path-item y de la operación (la op gana por (name,in)).
fn merged_params(op: &Value, path_item: &Value) -> Vec<ClientParam> {
    let mut out: Vec<ClientParam> = Vec::new();
    let mut seen: Vec<(String, String)> = Vec::new();
    for src in [op.get("parameters"), path_item.get("parameters")] {
        if let Some(arr) = src.and_then(|v| v.as_array()) {
            for p in arr {
                let name = match p.get("name").and_then(|v| v.as_str()) {
                    Some(n) => n.to_string(),
                    None => continue,
                };
                let location = match p.get("in").and_then(|v| v.as_str()) {
                    Some(l) => l.to_string(),
                    None => continue,
                };
                let key = (name.clone(), location.clone());
                if seen.contains(&key) {
                    continue;
                }
                seen.push(key);
                let required = p.get("required").and_then(|v| v.as_bool()).unwrap_or(location == "path");
                let schema = p.get("schema").cloned().unwrap_or(Value::Null);
                out.push(ClientParam { name, location, required, schema });
            }
        }
    }
    out
}

fn request_body(op: &Value) -> Option<(Value, bool)> {
    let rb = op.get("requestBody")?;
    let required = rb.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
    let content = rb.get("content").and_then(|v| v.as_object())?;
    let media = content
        .iter()
        .find(|(k, _)| k.contains("json"))
        .or_else(|| content.iter().next())?
        .1;
    let schema = media.get("schema").cloned()?;
    Some((schema, required))
}

fn primary_response_schema(op: &Value) -> Option<Value> {
    let resps = op.get("responses").and_then(|v| v.as_object())?;
    let mut candidates: Vec<(&String, &Value)> = resps
        .iter()
        .filter(|(status, _)| status.starts_with('2'))
        .collect();
    candidates.sort_by(|a, b| a.0.cmp(b.0));
    for (_, r) in candidates {
        if let Some(content) = r.get("content").and_then(|v| v.as_object()) {
            let media = content.iter().find(|(k, _)| k.contains("json")).or_else(|| content.iter().next());
            if let Some((_, m)) = media {
                if let Some(schema) = m.get("schema") {
                    return Some(schema.clone());
                }
            }
        }
    }
    None
}

/// Acceso a un miembro: `base.name` si es identificador válido, `base["name"]` si no.
fn member_access(base: &str, name: &str) -> String {
    let mut chars = name.chars();
    let valid_first = matches!(chars.next(), Some(c) if c.is_ascii_alphabetic() || c == '_' || c == '$');
    let valid_rest = name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$');
    if !name.is_empty() && valid_first && valid_rest {
        format!("{base}.{name}")
    } else {
        format!("{base}[\"{}\"]", name.replace('"', "\\\""))
    }
}

/// Convierte un operationId / nombre a un identificador camelCase válido.
fn camel_ident(s: &str) -> String {
    let mut out = String::new();
    let mut upper_next = false;
    for c in s.chars() {
        if c == '_' || c == '-' || c == ' ' || c == '.' {
            upper_next = true;
            continue;
        }
        if !c.is_ascii_alphanumeric() && c != '$' {
            continue;
        }
        if upper_next {
            out.extend(c.to_uppercase());
            upper_next = false;
        } else {
            out.push(c);
        }
    }
    if out.is_empty() {
        out.push('_');
    }
    if out.chars().next().map_or(false, |c| c.is_ascii_digit()) {
        out.insert(0, '_');
    }
    out
}

fn method_name(op: &Value, method: &str, path: &str) -> String {
    if let Some(id) = op.get("operationId").and_then(|v| v.as_str()) {
        if !id.trim().is_empty() {
            return camel_ident(id);
        }
    }
    let mut name = method.to_string();
    for seg in path.split('/').filter(|s| !s.is_empty()) {
        let clean = seg.trim_start_matches('{').trim_end_matches('}');
        let mut chars = clean.chars();
        if let Some(first) = chars.next() {
            name.extend(first.to_uppercase());
            name.push_str(chars.as_str());
        }
    }
    camel_ident(&name)
}

/// Sustituye `{x}` en la ruta por `${encodeURIComponent(String(params.x))}`.
fn path_template(path: &str) -> String {
    let mut out = String::new();
    let mut rest = path;
    while let Some(start) = rest.find('{') {
        out.push_str(&rest[..start]);
        if let Some(end) = rest[start..].find('}') {
            let name = &rest[start + 1..start + end];
            out.push_str(&format!("${{encodeURIComponent(String({}))}}", member_access("params", name)));
            rest = &rest[start + end + 1..];
        } else {
            out.push_str(&rest[start..]);
            rest = "";
            break;
        }
    }
    out.push_str(rest);
    out
}

fn emit_method(path: &str, method: &str, op: &Value, path_item: &Value) -> String {
    let name = method_name(op, method, path);
    let params = merged_params(op, path_item);
    let path_ps: Vec<&ClientParam> = params.iter().filter(|p| p.location == "path").collect();
    let query_ps: Vec<&ClientParam> = params.iter().filter(|p| p.location == "query").collect();

    // Tipo del objeto `params`.
    let mut fields: Vec<String> = Vec::new();
    for p in &path_ps {
        fields.push(format!("{}: {}", prop_key(&p.name), type_expr(&p.schema)));
    }
    for p in &query_ps {
        let opt = if p.required { "" } else { "?" };
        fields.push(format!("{}{}: {}", prop_key(&p.name), opt, type_expr(&p.schema)));
    }
    let has_params = !fields.is_empty();
    let all_optional = path_ps.is_empty() && query_ps.iter().all(|p| !p.required);

    let body = request_body(op);
    let ret = primary_response_schema(op).map(|s| type_expr(&s)).unwrap_or_else(|| "void".into());

    // Argumentos.
    let mut args: Vec<String> = Vec::new();
    if has_params {
        let default = if all_optional { " = {}" } else { "" };
        args.push(format!("params: {{ {} }}{}", fields.join("; "), default));
    }
    if let Some((bschema, brequired)) = &body {
        let opt = if *brequired { "" } else { "?" };
        args.push(format!("body{}: {}", opt, type_expr(bschema)));
    }

    // Opciones de `request`.
    let mut opt_parts: Vec<String> = Vec::new();
    if !query_ps.is_empty() {
        let q = query_ps
            .iter()
            .map(|p| format!("{}: {}", prop_key(&p.name), member_access("params", &p.name)))
            .collect::<Vec<_>>()
            .join(", ");
        opt_parts.push(format!("query: {{ {q} }}"));
    }
    if body.is_some() {
        opt_parts.push("body".into());
    }
    let opts_obj = if opt_parts.is_empty() {
        "{}".to_string()
    } else {
        format!("{{ {} }}", opt_parts.join(", "))
    };

    format!(
        "    {name}: ({}): Promise<{ret}> =>\n      request(config, \"{}\", `{}`, {}),\n",
        args.join(", "),
        method.to_uppercase(),
        path_template(path),
        opts_obj
    )
}

/// Emite una declaración top-level: `interface` si es objeto con propiedades,
/// `type` en cualquier otro caso (enum, alias, intersección…).
fn emit_named(name: &str, schema: &Value) -> String {
    let ident = sanitize_ident(name);
    let mut out = String::new();
    if let Some(doc) = doc_comment(schema, 0) {
        out.push_str(&doc);
    }
    if has_properties(schema) {
        out.push_str(&format!("export interface {ident} {{\n"));
        out.push_str(&emit_props(schema));
        out.push_str("}\n");
    } else {
        out.push_str(&format!("export type {ident} = {};\n", type_expr(schema)));
    }
    out
}

/// Emite las propiedades de un objeto (`  campo: T;` / `  campo?: T;`).
fn emit_props(schema: &Value) -> String {
    let empty = Map::new();
    let props = schema.get("properties").and_then(|v| v.as_object()).unwrap_or(&empty);
    let required = required_set(schema);

    let mut out = String::new();
    for (name, pschema) in props {
        if let Some(doc) = doc_comment(pschema, 1) {
            out.push_str(&doc);
        }
        let opt = if required.iter().any(|r| r == name) { "" } else { "?" };
        out.push_str(&format!("  {}{}: {};\n", prop_key(name), opt, type_expr(pschema)));
    }
    out
}

/// Traduce un nodo de esquema crudo a una expresión de tipo TS.
fn type_expr(schema: &Value) -> String {
    if let Some(r) = schema.get("$ref").and_then(|v| v.as_str()) {
        return ref_name(r);
    }

    let mut nullable = schema.get("nullable").and_then(|v| v.as_bool()) == Some(true);

    if let Some(en) = schema.get("enum").and_then(|v| v.as_array()) {
        if en.iter().any(|v| v.is_null()) {
            nullable = true;
        }
        let base = union_of(en.iter().filter(|v| !v.is_null()).map(literal));
        let base = if base.is_empty() { "unknown".into() } else { base };
        return with_null(base, nullable);
    }

    if let Some(all) = schema.get("allOf").and_then(|v| v.as_array()) {
        let parts: Vec<String> = all.iter().filter(|m| !is_meta_only(m)).map(type_expr).collect();
        let base = if parts.is_empty() { "unknown".into() } else { parts.join(" & ") };
        return with_null(base, nullable);
    }

    for key in ["anyOf", "oneOf"] {
        if let Some(vs) = schema.get(key).and_then(|v| v.as_array()) {
            let non_null: Vec<&Value> = vs.iter().filter(|v| !is_null_schema(v)).collect();
            if non_null.len() != vs.len() {
                nullable = true;
            }
            let base = if non_null.is_empty() {
                "unknown".into()
            } else {
                union_of(non_null.into_iter().map(type_expr))
            };
            return with_null(base, nullable);
        }
    }

    let types = collect_types(schema, &mut nullable);
    let base = match types.len() {
        0 => object_or_unknown(schema),
        1 => ts_for_type(&types[0], schema),
        _ => union_of(types.iter().map(|t| ts_for_type(t, schema))),
    };
    with_null(base, nullable)
}

/// Lee `type` (string en 3.0, array en 3.1) y separa el marcador `null`.
fn collect_types(schema: &Value, nullable: &mut bool) -> Vec<String> {
    let mut out = Vec::new();
    match schema.get("type") {
        Some(Value::String(t)) => {
            if t == "null" {
                *nullable = true;
            } else {
                out.push(t.clone());
            }
        }
        Some(Value::Array(a)) => {
            for it in a {
                if let Some(t) = it.as_str() {
                    if t == "null" {
                        *nullable = true;
                    } else {
                        out.push(t.to_string());
                    }
                }
            }
        }
        _ => {}
    }
    out
}

fn ts_for_type(t: &str, schema: &Value) -> String {
    match t {
        "string" => "string".into(),
        "integer" | "number" => "number".into(),
        "boolean" => "boolean".into(),
        "null" => "null".into(),
        "array" => {
            let inner = match schema.get("items") {
                Some(items) => type_expr(items),
                None => "unknown".into(),
            };
            if needs_parens(&inner) {
                format!("({inner})[]")
            } else {
                format!("{inner}[]")
            }
        }
        "object" => object_or_unknown(schema),
        _ => "unknown".into(),
    }
}

/// Objeto: literal inline si tiene propiedades; `Record<…>` si solo tiene
/// `additionalProperties`; `Record<string, unknown>` si está abierto.
fn object_or_unknown(schema: &Value) -> String {
    if has_properties(schema) {
        let props = schema.get("properties").and_then(|v| v.as_object()).unwrap();
        let required = required_set(schema);
        let parts: Vec<String> = props
            .iter()
            .map(|(k, v)| {
                let opt = if required.iter().any(|r| r == k) { "" } else { "?" };
                format!("{}{}: {}", prop_key(k), opt, type_expr(v))
            })
            .collect();
        format!("{{ {} }}", parts.join("; "))
    } else if let Some(ap) = schema.get("additionalProperties") {
        match ap {
            Value::Bool(_) => "Record<string, unknown>".into(),
            other => format!("Record<string, {}>", type_expr(other)),
        }
    } else {
        "Record<string, unknown>".into()
    }
}

// ---------- helpers ----------

fn has_properties(schema: &Value) -> bool {
    schema
        .get("properties")
        .and_then(|p| p.as_object())
        .map_or(false, |o| !o.is_empty())
}

fn required_set(schema: &Value) -> Vec<String> {
    schema
        .get("required")
        .and_then(|v| v.as_array())
        .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
        .unwrap_or_default()
}

fn with_null(base: String, nullable: bool) -> String {
    if nullable {
        format!("{base} | null")
    } else {
        base
    }
}

fn union_of(parts: impl Iterator<Item = String>) -> String {
    let mut seen: Vec<String> = Vec::new();
    for p in parts {
        if !seen.contains(&p) {
            seen.push(p);
        }
    }
    seen.join(" | ")
}

/// Literal TS de un valor de `enum`.
fn literal(v: &Value) -> String {
    match v {
        Value::String(s) => format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\"")),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        _ => "unknown".into(),
    }
}

fn ref_name(r: &str) -> String {
    sanitize_ident(r.rsplit('/').next().unwrap_or(r))
}

/// Convierte un nombre de modelo en un identificador TS válido.
fn sanitize_ident(name: &str) -> String {
    let mut s = String::new();
    for (i, c) in name.chars().enumerate() {
        let ok = c.is_ascii_alphanumeric() || c == '_' || c == '$';
        if i == 0 && c.is_ascii_digit() {
            s.push('_');
            s.push(c);
        } else if ok {
            s.push(c);
        } else {
            s.push('_');
        }
    }
    if s.is_empty() {
        s.push('_');
    }
    s
}

/// Clave de propiedad: tal cual si es identificador válido, entre comillas si no.
fn prop_key(name: &str) -> String {
    let mut chars = name.chars();
    let valid_first = matches!(chars.next(), Some(c) if c.is_ascii_alphabetic() || c == '_' || c == '$');
    let valid_rest = name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$');
    if !name.is_empty() && valid_first && valid_rest {
        name.to_string()
    } else {
        format!("\"{}\"", name.replace('"', "\\\""))
    }
}

/// `true` si un miembro de `allOf` solo aporta metadatos (description/title…),
/// sin estructura de tipo que emitir.
fn is_meta_only(m: &Value) -> bool {
    let keys = ["$ref", "type", "properties", "allOf", "anyOf", "oneOf", "enum", "items", "additionalProperties"];
    !keys.iter().any(|k| m.get(k).is_some())
}

fn is_null_schema(v: &Value) -> bool {
    match v.get("type") {
        // 3.0: type: "null"
        Some(Value::String(t)) => t == "null",
        // 3.1: type: ["null"] (solo null; ["string","null"] no es un esquema null).
        Some(Value::Array(a)) => !a.is_empty() && a.iter().all(|x| x.as_str() == Some("null")),
        _ => false,
    }
}

/// `true` si una expresión necesita paréntesis al envolverla en `[]`.
fn needs_parens(s: &str) -> bool {
    s.contains(" | ") || s.contains(" & ")
}

/// JSDoc a partir del `description` (una línea). El `title` se ignora a
/// propósito: FastAPI suele ponerlo igual al nombre del modelo y sería ruido.
fn doc_comment(schema: &Value, indent: usize) -> Option<String> {
    let text = schema.get("description").and_then(|v| v.as_str())?;
    let pad = "  ".repeat(indent);
    Some(format!("{pad}/** {} */\n", text.replace('\n', " ")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample() -> Value {
        json!({
            "openapi": "3.1.0",
            "info": { "title": "Mesero API", "version": "1.2.0" },
            "components": { "schemas": {
                "Estado": { "type": "string", "enum": ["pendiente", "confirmada"] },
                "Contacto": {
                    "type": "object",
                    "required": ["email"],
                    "properties": {
                        "email": { "type": "string", "format": "email" },
                        "telefono": { "type": "string" }
                    }
                },
                "ReservaCreate": {
                    "type": "object",
                    "required": ["cliente", "personas"],
                    "properties": {
                        "cliente": { "type": "string" },
                        "personas": { "type": "integer", "minimum": 1 },
                        "confirmada": { "type": "boolean" },
                        "acompanantes": { "type": "array", "items": { "type": "string" } },
                        "contacto": { "$ref": "#/components/schemas/Contacto" },
                        "notas": { "anyOf": [{ "type": "string" }, { "type": "null" }] }
                    }
                }
            }}
        })
    }

    #[test]
    fn cabecera_con_titulo_y_version() {
        let ts = generate_typescript(&sample());
        assert!(ts.contains("Tipos generados por Nala desde Mesero API 1.2.0"));
    }

    #[test]
    fn enum_como_union_de_literales() {
        let ts = generate_typescript(&sample());
        assert!(ts.contains("export type Estado = \"pendiente\" | \"confirmada\";"));
    }

    #[test]
    fn objeto_como_interface_con_required_y_opcionales() {
        let ts = generate_typescript(&sample());
        assert!(ts.contains("export interface ReservaCreate {"));
        assert!(ts.contains("cliente: string;"));
        assert!(ts.contains("personas: number;"));
        assert!(ts.contains("confirmada?: boolean;"));
    }

    #[test]
    fn array_y_ref_por_nombre() {
        let ts = generate_typescript(&sample());
        assert!(ts.contains("acompanantes?: string[];"));
        // $ref se emite por nombre, NO inlinado.
        assert!(ts.contains("contacto?: Contacto;"));
        assert!(!ts.contains("contacto?: { email"));
        assert!(ts.contains("export interface Contacto {"));
        assert!(ts.contains("email: string;"));
        assert!(ts.contains("telefono?: string;"));
    }

    #[test]
    fn anyof_con_null_es_nullable() {
        let ts = generate_typescript(&sample());
        assert!(ts.contains("notas?: string | null;"));
    }

    #[test]
    fn allof_es_interseccion_descartando_metadatos() {
        let spec = json!({
            "openapi": "3.1.0",
            "info": { "title": "X", "version": "1" },
            "components": { "schemas": {
                "Base": { "type": "object", "properties": { "id": { "type": "integer" } } },
                "Animal": { "allOf": [
                    { "$ref": "#/components/schemas/Base" },
                    { "description": "un animal" }
                ]}
            }}
        });
        let ts = generate_typescript(&spec);
        assert!(ts.contains("export type Animal = Base;"));
    }

    #[test]
    fn sin_modelos() {
        let spec = json!({ "openapi": "3.1.0", "info": { "title": "Vacía", "version": "1" } });
        let ts = generate_typescript(&spec);
        assert!(ts.contains("// (sin modelos)"));
    }

    fn client_spec() -> Value {
        json!({
            "openapi": "3.1.0",
            "info": { "title": "Mesero API", "version": "1.0.0" },
            "paths": {
                "/reservas": {
                    "get": {
                        "operationId": "list_reservas",
                        "parameters": [
                            { "name": "estado", "in": "query", "required": false, "schema": { "type": "string" } }
                        ],
                        "responses": { "200": { "description": "OK", "content": { "application/json": {
                            "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Reserva" } }
                        }}}}
                    },
                    "post": {
                        "operationId": "crear_reserva",
                        "requestBody": { "required": true, "content": { "application/json": {
                            "schema": { "$ref": "#/components/schemas/ReservaCreate" }
                        }}},
                        "responses": { "201": { "description": "Creada", "content": { "application/json": {
                            "schema": { "$ref": "#/components/schemas/Reserva" }
                        }}}}
                    }
                },
                "/reservas/{id}": {
                    "get": {
                        "operationId": "get_reserva",
                        "parameters": [ { "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } } ],
                        "responses": { "200": { "description": "OK", "content": { "application/json": {
                            "schema": { "$ref": "#/components/schemas/Reserva" }
                        }}}}
                    }
                }
            },
            "components": { "schemas": {
                "Reserva": { "type": "object", "properties": { "id": { "type": "integer" } } },
                "ReservaCreate": { "type": "object", "required": ["cliente"], "properties": { "cliente": { "type": "string" } } }
            }}
        })
    }

    #[test]
    fn cliente_runtime_y_factory() {
        let ts = generate_client(&client_spec());
        assert!(ts.contains("class ApiError"));
        assert!(ts.contains("export interface ClientConfig"));
        assert!(ts.contains("async function request<T>"));
        assert!(ts.contains("export function createClient(config: ClientConfig) {"));
        // los modelos se incluyen
        assert!(ts.contains("export interface ReservaCreate {"));
    }

    #[test]
    fn cliente_metodos_tipados() {
        let ts = generate_client(&client_spec());
        // body como 2º arg, retorno tipado
        assert!(ts.contains("crearReserva: (body: ReservaCreate): Promise<Reserva> =>"));
        // path param interpolado
        assert!(ts.contains("getReserva: (params: { id: number }): Promise<Reserva> =>"));
        assert!(ts.contains("/reservas/${encodeURIComponent(String(params.id))}"));
        // query opcional con default y objeto de query
        assert!(ts.contains("listReservas: (params: { estado?: string } = {}): Promise<Reserva[]> =>"));
        assert!(ts.contains("query: { estado: params.estado }"));
    }

    #[test]
    fn anyof_con_null_en_forma_array_3_1() {
        // OpenAPI 3.1 puede marcar el null como `type: ["null"]` dentro de un anyOf.
        let spec = json!({
            "openapi": "3.1.0",
            "info": { "title": "X", "version": "1" },
            "components": { "schemas": {
                "M": {
                    "type": "object",
                    "properties": {
                        "nota": { "anyOf": [{ "type": "string" }, { "type": ["null"] }] }
                    }
                }
            }}
        });
        let ts = generate_typescript(&spec);
        assert!(ts.contains("nota?: string | null;"));
    }
}
