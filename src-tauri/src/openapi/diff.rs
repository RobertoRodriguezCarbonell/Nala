//! Diff entre dos `NormalizedSpec`. Empareja operaciones por (método, ruta),
//! params por (nombre, ubicación), y campos top-level de request body y de la
//! respuesta de éxito primaria por nombre. Clasifica cada cambio como breaking
//! según su dirección: entrada (params/body) vs salida (respuesta).

use std::collections::BTreeMap;

use serde::Serialize;

use super::{NormalizedSpec, Operation, Param, Schema};

/// Referencia ligera a un snapshot (la rellena la capa de comandos).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotRef {
    pub id: i64,
    pub api_version: Option<String>,
    pub fetched_at: String,
    pub endpoint_count: i64,
}

/// Un cambio concreto entre dos esquemas, ya listo para pintar.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Change {
    /// "endpoint" | "param" | "requestBody" | "response"
    pub area: String,
    /// "added" | "removed" | "typeChanged" | "requiredAdded" | "requiredRemoved"
    pub op: String,
    pub method: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to_type: Option<String>,
    pub breaking: bool,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaDiff {
    pub from: SnapshotRef,
    pub to: SnapshotRef,
    pub changes: Vec<Change>,
    pub breaking_count: usize,
    pub non_breaking_count: usize,
}

/// Compara dos specs y arma el diff con sus referencias de snapshot.
pub fn diff_specs(
    from_ref: SnapshotRef,
    to_ref: SnapshotRef,
    from: &NormalizedSpec,
    to: &NormalizedSpec,
) -> SchemaDiff {
    let changes = compute_changes(from, to);
    let breaking_count = changes.iter().filter(|c| c.breaking).count();
    let non_breaking_count = changes.len() - breaking_count;
    SchemaDiff {
        from: from_ref,
        to: to_ref,
        changes,
        breaking_count,
        non_breaking_count,
    }
}

/// Núcleo del algoritmo: lista determinista de cambios entre dos specs.
fn compute_changes(from: &NormalizedSpec, to: &NormalizedSpec) -> Vec<Change> {
    let mut out = Vec::new();

    let from_ops: BTreeMap<(String, String), &Operation> = from
        .operations
        .iter()
        .map(|o| ((o.method.clone(), o.path.clone()), o))
        .collect();
    let to_ops: BTreeMap<(String, String), &Operation> = to
        .operations
        .iter()
        .map(|o| ((o.method.clone(), o.path.clone()), o))
        .collect();

    for (key, old_op) in &from_ops {
        match to_ops.get(key) {
            None => out.push(endpoint_change(old_op, "removed", true, "Endpoint eliminado")),
            Some(new_op) => diff_operation(old_op, new_op, &mut out),
        }
    }
    for (key, new_op) in &to_ops {
        if !from_ops.contains_key(key) {
            out.push(endpoint_change(new_op, "added", false, "Endpoint nuevo"));
        }
    }

    sort_changes(&mut out);
    out
}

fn endpoint_change(op: &Operation, kind: &str, breaking: bool, summary: &str) -> Change {
    Change {
        area: "endpoint".into(),
        op: kind.into(),
        method: op.method.clone(),
        path: op.path.clone(),
        target: None,
        location: None,
        from_type: None,
        to_type: None,
        breaking,
        summary: summary.into(),
    }
}

fn diff_operation(old: &Operation, new: &Operation, out: &mut Vec<Change>) {
    diff_params(old, new, out);
    diff_request_body(old, new, out);
    diff_response(old, new, out);
}

// ---------- params ----------

fn diff_params(old: &Operation, new: &Operation, out: &mut Vec<Change>) {
    let m = new.method.as_str();
    let p = new.path.as_str();

    let old_p: BTreeMap<(String, String), &Param> = old
        .parameters
        .iter()
        .map(|x| ((x.name.clone(), x.location.clone()), x))
        .collect();
    let new_p: BTreeMap<(String, String), &Param> = new
        .parameters
        .iter()
        .map(|x| ((x.name.clone(), x.location.clone()), x))
        .collect();

    for (key, op) in &old_p {
        if !new_p.contains_key(key) {
            out.push(Change {
                area: "param".into(),
                op: "removed".into(),
                method: m.into(),
                path: p.into(),
                target: Some(op.name.clone()),
                location: Some(op.location.clone()),
                from_type: Some(type_signature(&op.schema)),
                to_type: None,
                breaking: false,
                summary: format!("Param «{}» ({}) eliminado", op.name, op.location),
            });
        }
    }

    for (key, np) in &new_p {
        match old_p.get(key) {
            None => {
                let breaking = np.required;
                let req = if np.required { "obligatorio" } else { "opcional" };
                out.push(Change {
                    area: "param".into(),
                    op: "added".into(),
                    method: m.into(),
                    path: p.into(),
                    target: Some(np.name.clone()),
                    location: Some(np.location.clone()),
                    from_type: None,
                    to_type: Some(type_signature(&np.schema)),
                    breaking,
                    summary: format!("Param «{}» ({}) nuevo ({})", np.name, np.location, req),
                });
            }
            Some(op) => {
                let fs = type_signature(&op.schema);
                let ts = type_signature(&np.schema);
                if fs != ts {
                    out.push(Change {
                        area: "param".into(),
                        op: "typeChanged".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some(np.name.clone()),
                        location: Some(np.location.clone()),
                        from_type: Some(fs.clone()),
                        to_type: Some(ts.clone()),
                        breaking: true,
                        summary: format!(
                            "Param «{}» ({}) cambió de tipo: {} → {}",
                            np.name, np.location, fs, ts
                        ),
                    });
                }
                if !op.required && np.required {
                    out.push(Change {
                        area: "param".into(),
                        op: "requiredAdded".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some(np.name.clone()),
                        location: Some(np.location.clone()),
                        from_type: None,
                        to_type: None,
                        breaking: true,
                        summary: format!("Param «{}» ({}) ahora es obligatorio", np.name, np.location),
                    });
                } else if op.required && !np.required {
                    out.push(Change {
                        area: "param".into(),
                        op: "requiredRemoved".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some(np.name.clone()),
                        location: Some(np.location.clone()),
                        from_type: None,
                        to_type: None,
                        breaking: false,
                        summary: format!("Param «{}» ({}) ahora es opcional", np.name, np.location),
                    });
                }
            }
        }
    }
}

// ---------- request body (entrada) ----------

fn diff_request_body(old: &Operation, new: &Operation, out: &mut Vec<Change>) {
    let m = new.method.as_str();
    let p = new.path.as_str();
    let o = old.request_body.as_ref().map(|rb| &rb.schema);
    let n = new.request_body.as_ref().map(|rb| &rb.schema);

    match (o, n) {
        (None, None) => {}
        (Some(os), Some(ns)) if is_object_with_props(os) && is_object_with_props(ns) => {
            diff_input_fields("requestBody", "del body", m, p, os, ns, out);
        }
        _ => {
            let fs = o.map(type_signature).unwrap_or_else(|| "(sin body)".into());
            let ts = n.map(type_signature).unwrap_or_else(|| "(sin body)".into());
            if fs != ts {
                out.push(Change {
                    area: "requestBody".into(),
                    op: "typeChanged".into(),
                    method: m.into(),
                    path: p.into(),
                    target: None,
                    location: None,
                    from_type: Some(fs.clone()),
                    to_type: Some(ts.clone()),
                    breaking: true,
                    summary: format!("Body de petición cambió de tipo: {} → {}", fs, ts),
                });
            }
        }
    }
}

// ---------- response (salida) ----------

fn diff_response(old: &Operation, new: &Operation, out: &mut Vec<Change>) {
    let m = new.method.as_str();
    let p = new.path.as_str();
    let o = primary_success_schema(old);
    let n = primary_success_schema(new);

    match (o, n) {
        (Some(os), Some(ns)) if is_object_with_props(os) && is_object_with_props(ns) => {
            diff_output_fields(m, p, os, ns, out);
        }
        (Some(os), Some(ns)) => {
            let fs = type_signature(os);
            let ts = type_signature(ns);
            if fs != ts {
                out.push(Change {
                    area: "response".into(),
                    op: "typeChanged".into(),
                    method: m.into(),
                    path: p.into(),
                    target: None,
                    location: None,
                    from_type: Some(fs.clone()),
                    to_type: Some(ts.clone()),
                    breaking: true,
                    summary: format!("La respuesta cambió de tipo: {} → {}", fs, ts),
                });
            }
        }
        _ => {}
    }
}

/// Schema de la respuesta de éxito primaria (2xx de menor código con schema).
fn primary_success_schema(op: &Operation) -> Option<&Schema> {
    op.responses
        .iter()
        .filter(|r| r.status.starts_with('2') && r.schema.is_some())
        .min_by(|a, b| a.status.cmp(&b.status))
        .and_then(|r| r.schema.as_ref())
}

// ---------- diff de campos top-level ----------

/// Campos de entrada (request body): añadir required y cambio de tipo y pasar a
/// required son breaking; quitar y pasar a opcional, no.
fn diff_input_fields(
    area: &str,
    etiqueta: &str,
    m: &str,
    p: &str,
    old: &Schema,
    new: &Schema,
    out: &mut Vec<Change>,
) {
    let old_f: BTreeMap<&str, &super::Property> =
        old.properties.iter().map(|pr| (pr.name.as_str(), pr)).collect();
    let new_f: BTreeMap<&str, &super::Property> =
        new.properties.iter().map(|pr| (pr.name.as_str(), pr)).collect();

    for (name, of) in &old_f {
        if !new_f.contains_key(name) {
            out.push(Change {
                area: area.into(),
                op: "removed".into(),
                method: m.into(),
                path: p.into(),
                target: Some((*name).into()),
                location: None,
                from_type: Some(type_signature(&of.schema)),
                to_type: None,
                breaking: false,
                summary: format!("Campo «{}» {} eliminado", name, etiqueta),
            });
        }
    }

    for (name, nf) in &new_f {
        match old_f.get(name) {
            None => {
                let breaking = nf.required;
                let req = if nf.required { "obligatorio" } else { "opcional" };
                out.push(Change {
                    area: area.into(),
                    op: "added".into(),
                    method: m.into(),
                    path: p.into(),
                    target: Some((*name).into()),
                    location: None,
                    from_type: None,
                    to_type: Some(type_signature(&nf.schema)),
                    breaking,
                    summary: format!("Campo «{}» {} nuevo ({})", name, etiqueta, req),
                });
            }
            Some(of) => {
                let fs = type_signature(&of.schema);
                let ts = type_signature(&nf.schema);
                if fs != ts {
                    out.push(Change {
                        area: area.into(),
                        op: "typeChanged".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some((*name).into()),
                        location: None,
                        from_type: Some(fs.clone()),
                        to_type: Some(ts.clone()),
                        breaking: true,
                        summary: format!("Campo «{}» {} cambió de tipo: {} → {}", name, etiqueta, fs, ts),
                    });
                }
                if !of.required && nf.required {
                    out.push(Change {
                        area: area.into(),
                        op: "requiredAdded".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some((*name).into()),
                        location: None,
                        from_type: None,
                        to_type: None,
                        breaking: true,
                        summary: format!("Campo «{}» {} ahora es obligatorio", name, etiqueta),
                    });
                } else if of.required && !nf.required {
                    out.push(Change {
                        area: area.into(),
                        op: "requiredRemoved".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some((*name).into()),
                        location: None,
                        from_type: None,
                        to_type: None,
                        breaking: false,
                        summary: format!("Campo «{}» {} ahora es opcional", name, etiqueta),
                    });
                }
            }
        }
    }
}

/// Campos de salida (respuesta): quitar y cambio de tipo son breaking; añadir, no.
/// No se emiten cambios de `required` para la respuesta.
fn diff_output_fields(m: &str, p: &str, old: &Schema, new: &Schema, out: &mut Vec<Change>) {
    let old_f: BTreeMap<&str, &super::Property> =
        old.properties.iter().map(|pr| (pr.name.as_str(), pr)).collect();
    let new_f: BTreeMap<&str, &super::Property> =
        new.properties.iter().map(|pr| (pr.name.as_str(), pr)).collect();

    for (name, of) in &old_f {
        match new_f.get(name) {
            None => out.push(Change {
                area: "response".into(),
                op: "removed".into(),
                method: m.into(),
                path: p.into(),
                target: Some((*name).into()),
                location: None,
                from_type: Some(type_signature(&of.schema)),
                to_type: None,
                breaking: true,
                summary: format!("Campo «{}» de la respuesta eliminado", name),
            }),
            Some(nf) => {
                let fs = type_signature(&of.schema);
                let ts = type_signature(&nf.schema);
                if fs != ts {
                    out.push(Change {
                        area: "response".into(),
                        op: "typeChanged".into(),
                        method: m.into(),
                        path: p.into(),
                        target: Some((*name).into()),
                        location: None,
                        from_type: Some(fs.clone()),
                        to_type: Some(ts.clone()),
                        breaking: true,
                        summary: format!("Campo «{}» de la respuesta cambió de tipo: {} → {}", name, fs, ts),
                    });
                }
            }
        }
    }

    for (name, nf) in &new_f {
        if !old_f.contains_key(name) {
            out.push(Change {
                area: "response".into(),
                op: "added".into(),
                method: m.into(),
                path: p.into(),
                target: Some((*name).into()),
                location: None,
                from_type: None,
                to_type: Some(type_signature(&nf.schema)),
                breaking: false,
                summary: format!("Campo «{}» de la respuesta nuevo", name),
            });
        }
    }
}

// ---------- helpers ----------

fn is_object_with_props(s: &Schema) -> bool {
    !s.properties.is_empty()
}

/// Firma de tipo estable y legible para comparar y mostrar.
fn type_signature(s: &Schema) -> String {
    let base = if let Some(rn) = &s.ref_name {
        rn.clone()
    } else if let Some(items) = &s.items {
        format!("{}[]", type_signature(items))
    } else if let Some(en) = &s.enum_values {
        let mut vals: Vec<String> = en.iter().map(|v| v.to_string()).collect();
        vals.sort();
        format!("enum({})", vals.join(","))
    } else if !s.types.is_empty() {
        s.types.join("|")
    } else if !s.any_of.is_empty() {
        let mut parts: Vec<String> = s.any_of.iter().map(type_signature).collect();
        parts.sort();
        format!("({})", parts.join("|"))
    } else if !s.properties.is_empty() {
        "object".into()
    } else {
        "unknown".into()
    };
    if s.nullable {
        format!("{} | null", base)
    } else {
        base
    }
}

fn area_rank(area: &str) -> u8 {
    match area {
        "endpoint" => 0,
        "param" => 1,
        "requestBody" => 2,
        "response" => 3,
        _ => 4,
    }
}

/// Orden determinista: ruta, método, área, op, target.
fn sort_changes(v: &mut [Change]) {
    v.sort_by(|a, b| {
        a.path
            .cmp(&b.path)
            .then(a.method.cmp(&b.method))
            .then(area_rank(&a.area).cmp(&area_rank(&b.area)))
            .then(a.op.cmp(&b.op))
            .then(a.target.cmp(&b.target))
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn norm(v: serde_json::Value) -> NormalizedSpec {
        super::super::normalize(&v).unwrap()
    }

    fn base() -> serde_json::Value {
        json!({
            "openapi": "3.1.0",
            "info": { "title": "API", "version": "1.0.0" },
            "paths": {
                "/items": {
                    "get": {
                        "parameters": [
                            { "name": "q", "in": "query", "required": false, "schema": { "type": "string" } },
                            { "name": "sort", "in": "query", "required": false, "schema": { "type": "string" } },
                            { "name": "page", "in": "query", "required": false, "schema": { "type": "integer" } }
                        ],
                        "responses": { "200": { "description": "OK", "content": { "application/json": {
                            "schema": { "type": "object", "properties": {
                                "id": { "type": "integer" },
                                "name": { "type": "string" }
                            }}
                        }}}}
                    },
                    "post": {
                        "requestBody": { "required": true, "content": { "application/json": {
                            "schema": { "type": "object", "required": ["name"], "properties": {
                                "name": { "type": "string" },
                                "price": { "type": "number" }
                            }}
                        }}},
                        "responses": { "201": { "description": "Creado" } }
                    }
                },
                "/old": {
                    "delete": { "responses": { "204": { "description": "Borrado" } } }
                }
            }
        })
    }

    fn changed() -> serde_json::Value {
        json!({
            "openapi": "3.1.0",
            "info": { "title": "API", "version": "2.0.0" },
            "paths": {
                "/items": {
                    "get": {
                        "parameters": [
                            { "name": "q", "in": "query", "required": true, "schema": { "type": "string" } },
                            { "name": "sort", "in": "query", "required": false, "schema": { "type": "integer" } },
                            { "name": "limit", "in": "query", "required": true, "schema": { "type": "integer" } }
                        ],
                        "responses": { "200": { "description": "OK", "content": { "application/json": {
                            "schema": { "type": "object", "properties": {
                                "id": { "type": "integer" },
                                "tag": { "type": "string" }
                            }}
                        }}}}
                    },
                    "post": {
                        "requestBody": { "required": true, "content": { "application/json": {
                            "schema": { "type": "object", "required": ["sku"], "properties": {
                                "name": { "type": "string" },
                                "price": { "type": "string" },
                                "sku": { "type": "string" }
                            }}
                        }}},
                        "responses": { "201": { "description": "Creado" } }
                    }
                },
                "/new": {
                    "get": { "responses": { "200": { "description": "OK" } } }
                }
            }
        })
    }

    fn find<'a>(
        d: &'a [Change],
        area: &str,
        op: &str,
        path: &str,
        target: Option<&str>,
    ) -> Option<&'a Change> {
        d.iter().find(|c| {
            c.area == area && c.op == op && c.path == path && c.target.as_deref() == target
        })
    }

    #[test]
    fn endpoints_anadidos_y_quitados() {
        let d = compute_changes(&norm(base()), &norm(changed()));
        assert!(find(&d, "endpoint", "removed", "/old", None).unwrap().breaking);
        assert!(!find(&d, "endpoint", "added", "/new", None).unwrap().breaking);
    }

    #[test]
    fn params_anadidos_quitados_required_y_tipo() {
        let d = compute_changes(&norm(base()), &norm(changed()));
        assert!(find(&d, "param", "added", "/items", Some("limit")).unwrap().breaking);
        assert!(!find(&d, "param", "removed", "/items", Some("page")).unwrap().breaking);
        assert!(find(&d, "param", "requiredAdded", "/items", Some("q")).unwrap().breaking);
        assert!(find(&d, "param", "typeChanged", "/items", Some("sort")).unwrap().breaking);
    }

    #[test]
    fn campos_de_body_entrada() {
        let d = compute_changes(&norm(base()), &norm(changed()));
        assert!(find(&d, "requestBody", "added", "/items", Some("sku")).unwrap().breaking);
        assert!(find(&d, "requestBody", "typeChanged", "/items", Some("price")).unwrap().breaking);
        assert!(!find(&d, "requestBody", "requiredRemoved", "/items", Some("name")).unwrap().breaking);
    }

    #[test]
    fn campos_de_respuesta_salida() {
        let d = compute_changes(&norm(base()), &norm(changed()));
        assert!(find(&d, "response", "removed", "/items", Some("name")).unwrap().breaking);
        assert!(!find(&d, "response", "added", "/items", Some("tag")).unwrap().breaking);
    }

    #[test]
    fn firmas_de_tipo() {
        let mut s = Schema::default();
        s.types = vec!["string".into()];
        s.nullable = true;
        assert_eq!(type_signature(&s), "string | null");

        let mut r = Schema::default();
        r.ref_name = Some("Contacto".into());
        assert_eq!(type_signature(&r), "Contacto");

        let mut arr = Schema::default();
        arr.types = vec!["array".into()];
        let mut inner = Schema::default();
        inner.types = vec!["string".into()];
        arr.items = Some(Box::new(inner));
        assert_eq!(type_signature(&arr), "string[]");

        let mut en = Schema::default();
        en.types = vec!["string".into()];
        en.enum_values = Some(vec![json!("a"), json!("b")]);
        assert_eq!(type_signature(&en), "enum(\"a\",\"b\")");
    }

    #[test]
    fn contadores_y_determinismo() {
        let dummy = SnapshotRef { id: 0, api_version: None, fetched_at: String::new(), endpoint_count: 0 };
        let diff = diff_specs(dummy.clone(), dummy, &norm(base()), &norm(changed()));
        assert!(diff.breaking_count > 0);
        assert_eq!(diff.breaking_count + diff.non_breaking_count, diff.changes.len());

        // Mismo input → misma salida (orden determinista).
        let a = compute_changes(&norm(base()), &norm(changed()));
        let b = compute_changes(&norm(base()), &norm(changed()));
        assert_eq!(a, b);
    }
}
