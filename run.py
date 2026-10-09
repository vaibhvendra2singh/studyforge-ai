#!/usr/bin/env python3
"""
StudyForge AI — Cross-Platform Python Launcher
Run: python run.py
"""

import os
import sys
import time
import threading
import webbrowser
from pathlib import Path
from dotenv import load_dotenv

# Set root working directory
ROOT_DIR = Path(__file__).resolve().parent
os.chdir(ROOT_DIR)

# Add backend to sys.path so backend modules import cleanly
sys.path.insert(0, str(ROOT_DIR / "backend"))

# Load environment
load_dotenv(ROOT_DIR / ".env")

port = int(os.environ.get("PORT", 5001))
debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"

# Free port if already occupied
try:
    import subprocess
    pids = subprocess.check_output(["lsof", "-ti", f":{port}"], stderr=subprocess.DEVNULL).decode().strip().split()
    for pid in pids:
        if pid and int(pid) != os.getpid():
            print(f"🔄 Freeing port {port} (stopping PID {pid})...")
            os.kill(int(pid), 9)
    time.sleep(0.3)
except Exception:
    pass

print("=" * 60)
print("⚡ StudyForge AI — Lecture Notes to Study Pack Generator")
print("=" * 60)
print(f"📁 Root directory: {ROOT_DIR}")
print(f"🤖 Groq Model:     {os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')}")
print(f"🌐 Application:    http://localhost:{port}")
print(f"🔬 Prompt Lab:     http://localhost:{port}/prompt-lab")
print(f"📊 Evaluation:     http://localhost:{port}/evaluation")
print("=" * 60)

def open_browser():
    time.sleep(1.2)
    url = f"http://localhost:{port}"
    print(f"🚀 Opening {url} in your default browser...")
    webbrowser.open(url)

# Open browser in background thread
threading.Thread(target=open_browser, daemon=True).start()

# Launch Flask App
if __name__ == "__main__":
    from app import app
    app.run(host="0.0.0.0", port=port, debug=debug)
