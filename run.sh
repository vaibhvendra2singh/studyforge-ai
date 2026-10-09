#!/bin/bash

# ==============================================================================
# StudyForge AI — Application Launcher Script
# ==============================================================================

set -e

# Change directory to project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "⚡ Starting StudyForge AI — Lecture Notes to Study Pack"
echo "=========================================================="

# 1. Check or activate virtual environment
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment (venv)..."
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo "📦 Activating virtual environment (../venv)..."
    source ../venv/bin/activate
else
    echo "⚙️ Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installing dependencies from backend/requirements.txt..."
    pip install -r backend/requirements.txt
fi

# 2. Check for .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️ .env not found. Creating from .env.example..."
        cp .env.example .env
        echo "❗ Please make sure your GROQ_API_KEY is configured in .env"
    else
        echo "⚠️ Warning: No .env file found."
    fi
fi

# 3. Read PORT from .env or default to 5001
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d '=' -f2 | tr -d ' "' || true)
if [ -z "$PORT" ]; then
    PORT=5001
fi

# Automatically free port if in use
EXISTING_PID=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
    echo "🔄 Port $PORT is already in use by PID $EXISTING_PID. Freeing port..."
    kill -9 $EXISTING_PID 2>/dev/null || true
    sleep 0.5
fi

echo "🌐 Server target: http://localhost:$PORT"

# 4. Automatically open browser on macOS after a short delay
(
    sleep 1.5
    if command -v open >/dev/null 2>&1; then
        echo "🚀 Opening browser at http://localhost:$PORT ..."
        open "http://localhost:$PORT"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:$PORT"
    fi
) &

# 5. Launch the Flask backend
cd backend
python3 app.py
