"""Mock API de Mesero para probar el constructor de Nala en local.

Sirve el spec en /openapi.json y responde a los endpoints con JSON de ejemplo.
Uso:  python scripts/mock-api.py [puerto]   (por defecto 8790)
"""
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

SPEC = (Path(__file__).parent / "sample-api" / "openapi.json").read_text(encoding="utf-8")

RESERVAS = [
    {"id": 1, "cliente": "María Olano", "personas": 4, "estado": "confirmada"},
    {"id": 2, "cliente": "Jordi Vives", "personas": 2, "estado": "pendiente"},
]

EXPECTED_TOKEN = "tok_demo_123"
EXPECTED_API_KEY = "key_demo_123"


def _parse_creds(raw, content_type):
    """Extrae credenciales del cuerpo de login (JSON o form-urlencoded)."""
    if "application/json" in content_type:
        try:
            return json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return {}
    from urllib.parse import parse_qs
    return {k: v[0] for k, v in parse_qs(raw.decode("utf-8", "ignore")).items()}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload=None, raw=None):
        if raw is not None:
            body = raw
        else:
            body = b"" if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        if body:
            self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}

    def _authorized(self):
        if self.headers.get("Authorization") == f"Bearer {EXPECTED_TOKEN}":
            return True
        if self.headers.get("X-API-Key") == EXPECTED_API_KEY:
            return True
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        return EXPECTED_API_KEY in qs.get("api_key", [])

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/openapi.json":
            return self._send(200, raw=SPEC.encode("utf-8"))
        if path.startswith("/reservas"):
            if not self._authorized():
                return self._send(401, {"detail": "No autenticado"})
            if path.startswith("/reservas/"):
                rid = path.rsplit("/", 1)[-1]
                return self._send(200, {"id": rid, "cliente": "María Olano", "personas": 4})
            return self._send(200, RESERVAS)
        return self._send(404, {"detail": "Not Found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        raw = self.rfile.read(length) if length else b""
        path = self.path.split("?", 1)[0]

        if path == "/auth/login":
            creds = _parse_creds(raw, self.headers.get("Content-Type", ""))
            if creds.get("username") == "demo" and creds.get("password") == "demo":
                return self._send(200, {
                    "access_token": EXPECTED_TOKEN,
                    "token_type": "bearer",
                    "expires_in": 30,
                })
            return self._send(401, {"detail": "Credenciales inválidas"})

        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            data = {}
        if path == "/reservas":
            return self._send(201, {"id": 3, **data})
        return self._send(404, {"detail": "Not Found"})

    def do_DELETE(self):
        if re.match(r"^/reservas/\w+$", self.path):
            return self._send(204)
        return self._send(404, {"detail": "Not Found"})

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    print(f"Mock Mesero API en http://127.0.0.1:{port}")
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
