import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app import app as flask_app

class FixPathMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        # Retrieve actual client path from Vercel proxy headers
        path = (
            environ.get("HTTP_X_VERCEL_PATH")
            or environ.get("HTTP_X_MATCHED_PATH")
            or environ.get("HTTP_X_FORWARDED_URI")
            or environ.get("RAW_URI")
        )
        if path:
            environ["PATH_INFO"] = path.split("?")[0]
        elif environ.get("PATH_INFO", "").startswith("/api/index.py"):
            rel = environ["PATH_INFO"][len("/api/index.py"):]
            environ["PATH_INFO"] = rel if rel.startswith("/") else "/" + rel

        # Ensure root path default
        if not environ.get("PATH_INFO"):
            environ["PATH_INFO"] = "/"

        return self.wsgi_app(environ, start_response)

app = FixPathMiddleware(flask_app)
