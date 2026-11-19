import sys
import urllib.parse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app import app as flask_app

# Absolute path bindings so template and static assets resolve reliably on Vercel
flask_app.static_folder = str(ROOT_DIR / "frontend" / "static")
flask_app.template_folder = str(ROOT_DIR / "frontend" / "templates")

# Fallback route registrations in case the entrypoint is hit directly
@flask_app.route("/api/index")
@flask_app.route("/api/index.py")
def vercel_entrypoint_fallback():
    return flask_app.view_functions["index"]()

class VercelWSGIRouter:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        qs = environ.get("QUERY_STRING", "")
        params = urllib.parse.parse_qs(qs)
        
        # Check for our explicitly injected route param
        if "__vercel_route" in params:
            route = params.get("__vercel_route", ["/"])[0]
            if not route.startswith("/"):
                route = "/" + route
            environ["PATH_INFO"] = route
            
            # Rebuild clean query string without __vercel_route
            remaining = {k: v for k, v in params.items() if k != "__vercel_route"}
            environ["QUERY_STRING"] = urllib.parse.urlencode(remaining, doseq=True)
        elif environ.get("PATH_INFO", "").startswith("/api/index"):
            environ["PATH_INFO"] = "/"

        return self.app(environ, start_response)

app = VercelWSGIRouter(flask_app)
