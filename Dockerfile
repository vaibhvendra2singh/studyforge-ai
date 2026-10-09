FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV PORT=7860

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run the app with gunicorn
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:7860", "--chdir", "backend", "app:app"]
