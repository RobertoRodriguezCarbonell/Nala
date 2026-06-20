use serde_json::{Map, Value};

use crate::error::AppError;

use super::{NormalizedSpec, Operation, Param, Property, RequestBody, ResponseDef, Schema};

const METHODS: &[&str] = &[
    "get", "post", "put", "patch", "delete", "head", "options", "trace",
];

/// Normaliza un `openapi.json` (3.0 o 3.1) a nuestro modelo digerido.
pub fn normalize(spec: &Value) -> Result<NormalizedSpec, AppError> {
    let openapi_version = spec
        .get("openapi")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| AppError::Spec("falta el campo \"openapi\" (¿es un spec OpenAPI?)".into()))?;

    let title = spec.pointer("/info/title").and_then(|v| v.as_str()).map(String::from);
    let version = spec.pointer("/info/version").and_then(|v| v.as_str()).map(String::from);

    let empty = Map::new();
    let schemas = spec
        .pointer("/components/schemas")
        .and_then(|v| v.as_object())
        .unwrap_or(&empty);
    let norm = Normalizer { schemas };

    let mut operations = Vec::new();
    if let Some(paths) = spec.get("paths").and_then(|v| v.as_object()) {
        for (path, item) in paths {
            let path_params = item.get("parameters").and_then(|v| v.as_array());
            for &method in METHODS {
                if let Some(op) = item.get(method) {
                    operations.push(norm.build_operation(method, path, op, path_params));
                }
            }
        }
    }

    Ok(NormalizedSpec {
        openapi_version,
        title,
        version,
        operations,
    })
}

struct Normalizer<'a> {
    schemas: &'a Map<String, Value>,
}

impl<'a> Normalizer<'a> {
    fn build_operation(
        &self,
        method: &str,
        path: &str,
        op: &Value,
        path_params: Option<&Vec<Value>>,
    ) -> Operation {
        // Parámetros: los de la operación tienen prioridad sobre los del path.
        let mut params: Vec<Param> = Vec::new();
        let mut seen: Vec<(String, String)> = Vec::new();

        if let Some(arr) = op.get("parameters").and_then(|v| v.as_array()) {
            self.collect_params(arr, &mut params, &mut seen);
        }
        if let Some(arr) = path_params {
            self.collect_params(arr, &mut params, &mut seen);
        }

        Operation {
            method: method.to_uppercase(),
            path: path.to_string(),
            operation_id: op.get("operationId").and_then(|v| v.as_str()).map(String::from),
            summary: op.get("summary").and_then(|v| v.as_str()).map(String::from),
            description: op.get("description").and_then(|v| v.as_str()).map(String::from),
            tags: op
                .get("tags")
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|t| t.as_str().map(String::from)).collect())
                .unwrap_or_default(),
            deprecated: op.get("deprecated").and_then(|v| v.as_bool()).unwrap_or(false),
            parameters: params,
            request_body: self.build_request_body(op),
            responses: self.build_responses(op),
        }
    }

    fn collect_params(
        &self,
        arr: &[Value],
        out: &mut Vec<Param>,
        seen: &mut Vec<(String, String)>,
    ) {
        for p in arr {
            if let Some(param) = self.build_param(p) {
                let key = (param.name.clone(), param.location.clone());
                if !seen.contains(&key) {
                    seen.push(key);
                    out.push(param);
                }
            }
        }
    }

    fn build_param(&self, p: &Value) -> Option<Param> {
        let name = p.get("name")?.as_str()?.to_string();
        let location = p.get("in")?.as_str()?.to_string();
        let required = p
            .get("required")
            .and_then(|v| v.as_bool())
            .unwrap_or(location == "path");
        let description = p.get("description").and_then(|v| v.as_str()).map(String::from);
        let schema = match p.get("schema") {
            Some(sv) => self.resolve(sv, &mut Vec::new()),
            None => Schema::default(),
        };
        Some(Param {
            name,
            location,
            required,
            description,
            schema,
        })
    }

    fn build_request_body(&self, op: &Value) -> Option<RequestBody> {
        let rb = op.get("requestBody")?;
        let required = rb.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
        let content = rb.get("content")?.as_object()?;
        let (ct, media) = pick_media(content)?;
        let schema = media
            .get("schema")
            .map(|s| self.resolve(s, &mut Vec::new()))
            .unwrap_or_default();
        Some(RequestBody {
            required,
            content_type: ct,
            schema,
        })
    }

    fn build_responses(&self, op: &Value) -> Vec<ResponseDef> {
        let mut out = Vec::new();
        if let Some(resps) = op.get("responses").and_then(|v| v.as_object()) {
            for (status, r) in resps {
                let description = r.get("description").and_then(|v| v.as_str()).map(String::from);
                let mut content_type = None;
                let mut schema = None;
                if let Some(content) = r.get("content").and_then(|v| v.as_object()) {
                    if let Some((ct, media)) = pick_media(content) {
                        content_type = Some(ct);
                        schema = media.get("schema").map(|s| self.resolve(s, &mut Vec::new()));
                    }
                }
                out.push(ResponseDef {
                    status: status.clone(),
                    description,
                    content_type,
                    schema,
                });
            }
        }
        out
    }

    /// Resuelve un nodo de esquema a `Schema`, expandiendo `$ref` locales con
    /// detección de ciclos (la pila lleva los nombres de modelo en curso).
    fn resolve(&self, node: &Value, stack: &mut Vec<String>) -> Schema {
        if let Some(r) = node.get("$ref").and_then(|v| v.as_str()) {
            return self.resolve_ref(r, stack);
        }

        let mut s = Schema::default();

        // allOf → fusión (caso típico de FastAPI: [{$ref}, {description}]).
        if let Some(all) = node.get("allOf").and_then(|v| v.as_array()) {
            for sub in all {
                let resolved = self.resolve(sub, stack);
                merge_into(&mut s, resolved);
            }
        }

        // anyOf / oneOf → si es "X o null", reducimos a X nullable.
        for key in ["anyOf", "oneOf"] {
            if let Some(variants) = node.get(key).and_then(|v| v.as_array()) {
                let non_null: Vec<&Value> = variants.iter().filter(|v| !is_null_schema(v)).collect();
                let has_null = non_null.len() != variants.len();
                if non_null.len() == 1 {
                    let mut inner = self.resolve(non_null[0], stack);
                    inner.nullable = inner.nullable || has_null;
                    apply_meta(&mut inner, node);
                    return inner;
                }
                for v in non_null {
                    s.any_of.push(self.resolve(v, stack));
                }
                s.nullable = s.nullable || has_null;
            }
        }

        // type: string (3.0) o array (3.1, p. ej. ["string","null"]).
        match node.get("type") {
            Some(Value::String(t)) => {
                if t == "null" {
                    s.nullable = true;
                } else {
                    s.types.push(t.clone());
                }
            }
            Some(Value::Array(arr)) => {
                for it in arr {
                    if let Some(t) = it.as_str() {
                        if t == "null" {
                            s.nullable = true;
                        } else {
                            s.types.push(t.to_string());
                        }
                    }
                }
            }
            _ => {}
        }
        if node.get("nullable").and_then(|v| v.as_bool()) == Some(true) {
            s.nullable = true;
        }

        apply_meta(&mut s, node);

        if let Some(props) = node.get("properties").and_then(|v| v.as_object()) {
            let required: Vec<String> = node
                .get("required")
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
                .unwrap_or_default();
            for (name, pv) in props {
                let schema = self.resolve(pv, stack);
                s.properties.push(Property {
                    name: name.clone(),
                    required: required.contains(name),
                    schema,
                });
            }
            for r in required {
                if !s.required.contains(&r) {
                    s.required.push(r);
                }
            }
        }

        if let Some(items) = node.get("items") {
            s.items = Some(Box::new(self.resolve(items, stack)));
            if s.types.is_empty() {
                s.types.push("array".into());
            }
        }

        if s.types.is_empty() && !s.properties.is_empty() {
            s.types.push("object".into());
        }

        s
    }

    fn resolve_ref(&self, reference: &str, stack: &mut Vec<String>) -> Schema {
        let name = reference.rsplit('/').next().unwrap_or(reference).to_string();

        if stack.contains(&name) {
            // Ciclo: cortamos la expansión pero conservamos el nombre del modelo.
            return Schema {
                ref_name: Some(name),
                circular: true,
                types: vec!["object".into()],
                ..Default::default()
            };
        }

        match self.schemas.get(&name) {
            Some(target) => {
                stack.push(name.clone());
                let mut resolved = self.resolve(target, stack);
                stack.pop();
                if resolved.title.is_none() {
                    resolved.title = Some(name.clone());
                }
                resolved.ref_name = Some(name);
                resolved
            }
            None => Schema {
                ref_name: Some(name),
                types: vec!["object".into()],
                ..Default::default()
            },
        }
    }
}

/// Elige el media type preferido de un `content` (prioriza JSON).
fn pick_media(content: &Map<String, Value>) -> Option<(String, Value)> {
    content
        .iter()
        .find(|(k, _)| k.contains("json"))
        .or_else(|| content.iter().next())
        .map(|(k, v)| (k.clone(), v.clone()))
}

/// `true` si el nodo representa el tipo null (`{"type":"null"}`).
fn is_null_schema(v: &Value) -> bool {
    matches!(v.get("type").and_then(|t| t.as_str()), Some("null"))
}

/// Copia metadatos del nodo crudo al `Schema` si aún no están puestos.
fn apply_meta(s: &mut Schema, node: &Value) {
    if s.title.is_none() {
        s.title = node.get("title").and_then(|v| v.as_str()).map(String::from);
    }
    if s.description.is_none() {
        s.description = node.get("description").and_then(|v| v.as_str()).map(String::from);
    }
    if s.format.is_none() {
        s.format = node.get("format").and_then(|v| v.as_str()).map(String::from);
    }
    if s.enum_values.is_none() {
        s.enum_values = node.get("enum").and_then(|v| v.as_array()).cloned();
    }
    if s.default.is_none() {
        s.default = node.get("default").cloned();
    }
    if s.example.is_none() {
        s.example = node.get("example").cloned().or_else(|| {
            node.get("examples")
                .and_then(|v| v.as_array())
                .and_then(|a| a.first())
                .cloned()
        });
    }
    if s.minimum.is_none() {
        s.minimum = node.get("minimum").and_then(|v| v.as_f64());
    }
    if s.maximum.is_none() {
        s.maximum = node.get("maximum").and_then(|v| v.as_f64());
    }
    if s.min_length.is_none() {
        s.min_length = node.get("minLength").and_then(|v| v.as_u64());
    }
    if s.max_length.is_none() {
        s.max_length = node.get("maxLength").and_then(|v| v.as_u64());
    }
    if s.pattern.is_none() {
        s.pattern = node.get("pattern").and_then(|v| v.as_str()).map(String::from);
    }
}

/// Fusiona `src` dentro de `dst` (para `allOf`), sin pisar lo ya presente.
fn merge_into(dst: &mut Schema, mut src: Schema) {
    if dst.types.is_empty() {
        dst.types = std::mem::take(&mut src.types);
    }
    dst.properties.append(&mut src.properties);
    for r in src.required {
        if !dst.required.contains(&r) {
            dst.required.push(r);
        }
    }
    dst.nullable = dst.nullable || src.nullable;
    if dst.title.is_none() {
        dst.title = src.title;
    }
    if dst.description.is_none() {
        dst.description = src.description;
    }
    if dst.format.is_none() {
        dst.format = src.format;
    }
    if dst.items.is_none() {
        dst.items = src.items;
    }
    if dst.enum_values.is_none() {
        dst.enum_values = src.enum_values;
    }
    if dst.ref_name.is_none() {
        dst.ref_name = src.ref_name;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample_spec() -> Value {
        // Spec estilo FastAPI (OpenAPI 3.1): tipos como array, anyOf con null,
        // enum, array<string>, objeto anidado vía $ref, params de path y query.
        json!({
            "openapi": "3.1.0",
            "info": { "title": "Mesero API", "version": "1.2.0" },
            "paths": {
                "/reservas": {
                    "get": {
                        "tags": ["reservas"],
                        "summary": "Lista reservas",
                        "operationId": "list_reservas",
                        "parameters": [
                            { "name": "estado", "in": "query", "required": false,
                              "schema": { "type": "string", "enum": ["pendiente", "confirmada"] } },
                            { "name": "limit", "in": "query", "required": false,
                              "schema": { "type": "integer", "minimum": 1 } }
                        ],
                        "responses": { "200": { "description": "OK" } }
                    },
                    "post": {
                        "tags": ["reservas"],
                        "operationId": "crear_reserva",
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/ReservaCreate" }
                                }
                            }
                        },
                        "responses": { "201": { "description": "Creada" } }
                    }
                },
                "/reservas/{id}": {
                    "get": {
                        "operationId": "get_reserva",
                        "parameters": [
                            { "name": "id", "in": "path", "required": true,
                              "schema": { "type": "integer" } }
                        ],
                        "responses": { "200": { "description": "OK" } }
                    }
                }
            },
            "components": {
                "schemas": {
                    "Contacto": {
                        "type": "object",
                        "properties": {
                            "email": { "type": "string", "format": "email" },
                            "telefono": { "type": "string" }
                        },
                        "required": ["email"]
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
                }
            }
        })
    }

    fn op<'a>(spec: &'a NormalizedSpec, method: &str, path: &str) -> &'a Operation {
        spec.operations
            .iter()
            .find(|o| o.method == method && o.path == path)
            .expect("operación no encontrada")
    }

    #[test]
    fn extrae_info_y_operaciones() {
        let spec = normalize(&sample_spec()).unwrap();
        assert_eq!(spec.openapi_version, "3.1.0");
        assert_eq!(spec.title.as_deref(), Some("Mesero API"));
        assert_eq!(spec.operations.len(), 3);
    }

    #[test]
    fn parametros_de_query_y_path() {
        let spec = normalize(&sample_spec()).unwrap();

        let get = op(&spec, "GET", "/reservas");
        assert_eq!(get.parameters.len(), 2);
        let estado = &get.parameters[0];
        assert_eq!(estado.location, "query");
        assert!(!estado.required);
        assert_eq!(estado.schema.enum_values.as_ref().unwrap().len(), 2);

        let by_id = op(&spec, "GET", "/reservas/{id}");
        assert!(by_id.parameters[0].required);
        assert_eq!(by_id.parameters[0].location, "path");
    }

    #[test]
    fn request_body_con_ref_resuelto() {
        let spec = normalize(&sample_spec()).unwrap();
        let post = op(&spec, "POST", "/reservas");

        let body = post.request_body.as_ref().expect("debería tener body");
        assert!(body.required);
        assert_eq!(body.content_type, "application/json");
        assert_eq!(body.schema.ref_name.as_deref(), Some("ReservaCreate"));

        let props = &body.schema.properties;
        let by_name = |n: &str| props.iter().find(|p| p.name == n).unwrap();

        // required propagado
        assert!(by_name("cliente").required);
        assert!(by_name("personas").required);
        assert!(!by_name("confirmada").required);

        // array<string>
        let acomp = &by_name("acompanantes").schema;
        assert_eq!(acomp.types, vec!["array"]);
        assert_eq!(acomp.items.as_ref().unwrap().types, vec!["string"]);

        // objeto anidado vía $ref
        let contacto = &by_name("contacto").schema;
        assert_eq!(contacto.ref_name.as_deref(), Some("Contacto"));
        assert!(contacto.properties.iter().any(|p| p.name == "email" && p.required));

        // anyOf [string, null] → string nullable
        let notas = &by_name("notas").schema;
        assert_eq!(notas.types, vec!["string"]);
        assert!(notas.nullable);
    }
}
