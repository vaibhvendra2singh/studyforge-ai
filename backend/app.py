"""
StudyForge AI — Lecture Notes to Study Pack Generator
Main Flask Application
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from routes.generate import generate_bp
from routes.evaluate import evaluate_bp
from routes.prompt_lab import prompt_lab_bp

load_dotenv()

app = Flask(
    __name__,
    static_folder="../frontend/static",
    template_folder="../frontend/templates"
)

CORS(app, origins=["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5001", "http://127.0.0.1:5001"])

# Register blueprints
app.register_blueprint(generate_bp, url_prefix="/api")
app.register_blueprint(evaluate_bp, url_prefix="/api")
app.register_blueprint(prompt_lab_bp, url_prefix="/api")

# Serve the frontend pages
from flask import render_template, jsonify

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate")
def generate_page():
    return render_template("index.html")

@app.route("/library")
def library_page():
    return render_template("index.html")

@app.route("/settings")
def settings_page():
    return render_template("index.html")

@app.route("/prompt-lab")
def prompt_lab():
    return render_template("prompt_lab.html")

@app.route("/evaluation")
def evaluation():
    return render_template("evaluation.html")

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "connected",
        "service": "StudyForge AI",
        "provider": "Groq Cloud API",
        "model": "openai/gpt-oss-120b",
        "version": "2.4.0"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
