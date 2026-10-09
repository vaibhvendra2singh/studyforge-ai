import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test that the frontend is served correctly"""
    rv = client.get("/")
    assert rv.status_code == 200
    assert b"StudyForge AI" in rv.data

def test_api_generate_missing_data(client):
    """Test the /api/generate endpoint with missing notes"""
    rv = client.post("/api/generate", json={})
    assert rv.status_code == 400
    
def test_evaluation_get(client):
    """Test the evaluation list endpoint"""
    rv = client.get("/api/evaluate")
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)
