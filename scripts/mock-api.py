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

    def do_GET(self):
        if self.path == "/openapi.json":
            return self._send(200, raw=SPEC.encode("utf-8"))
        if self.path.startswith("/reservas/"):
            rid = self.path.rsplit("/", 1)[-1]
            return self._send(200, {"id": rid, "cliente": "María Olano", "personas": 4})
        if self.path.startswith("/reservas"):
            return self._send(200, RESERVAS)
        return self._send(404, {"detail": "Not Found"})

    def do_POST(self):
        data = self._read_body()
        if self.path == "/auth/login":
            return self._send(200, {"access_token": "tok_demo_123", "token_type": "bearer"})
        if self.path == "/reservas":
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
