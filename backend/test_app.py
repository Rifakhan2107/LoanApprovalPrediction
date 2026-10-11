import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# Sample applicant representing an approved profile
VALID_APPROVED_APPLICANT = {
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 9600000,
    "loan_amount": 29900000,
    "loan_term": 12,
    "cibil_score": 778,
    "residential_assets_value": 2400000,
    "commercial_assets_value": 17600000,
    "luxury_assets_value": 22700000,
    "bank_asset_value": 8000000,
}

# Sample applicant representing a rejected profile
VALID_REJECTED_APPLICANT = {
    "no_of_dependents": 0,
    "education": "Not Graduate",
    "self_employed": "Yes",
    "income_annum": 4100000,
    "loan_amount": 12200000,
    "loan_term": 8,
    "cibil_score": 417,
    "residential_assets_value": 2700000,
    "commercial_assets_value": 2200000,
    "luxury_assets_value": 8800000,
    "bank_asset_value": 3300000,
}


def test_health_endpoint(client):
    """GET /health returns 200 with model readiness information."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "model" in data
    assert data["model"] == "Random Forest"
    assert "accuracy" in data
    assert data["accuracy"] > 0.95


def test_predict_approved(client):
    """POST /predict returns 200 and 'Approved' for creditworthy applicant."""
    response = client.post("/predict", json=VALID_APPROVED_APPLICANT)
    assert response.status_code == 200
    data = response.get_json()
    assert data["prediction"] == "Approved"
    assert "approval_probability" in data
    assert 0.0 <= data["approval_probability"] <= 1.0
    assert "message" in data


def test_predict_rejected(client):
    """POST /predict returns 200 and 'Rejected' for high-risk applicant."""
    response = client.post("/predict", json=VALID_REJECTED_APPLICANT)
    assert response.status_code == 200
    data = response.get_json()
    assert data["prediction"] == "Rejected"
    assert "approval_probability" in data
    assert 0.0 <= data["approval_probability"] <= 1.0


def test_predict_accepts_strings_for_numeric(client):
    """POST /predict accepts numeric fields as string format (like form input)."""
    string_formatted = {k: str(v) for k, v in VALID_APPROVED_APPLICANT.items()}
    response = client.post("/predict", json=string_formatted)
    assert response.status_code == 200
    data = response.get_json()
    assert data["prediction"] in ("Approved", "Rejected")


def test_predict_missing_fields(client):
    """POST /predict returns 400 when required fields are missing."""
    incomplete = VALID_APPROVED_APPLICANT.copy()
    del incomplete["cibil_score"]
    del incomplete["income_annum"]
    response = client.post("/predict", json=incomplete)
    assert response.status_code == 400
    data = response.get_json()
    assert "Missing required fields" in data["error"]
    assert "cibil_score" in data["error"]
    assert "income_annum" in data["error"]


def test_predict_invalid_cibil(client):
    """POST /predict returns 400 when CIBIL score is out of 300-900 bounds."""
    invalid = VALID_APPROVED_APPLICANT.copy()
    invalid["cibil_score"] = 250
    response = client.post("/predict", json=invalid)
    assert response.status_code == 400
    data = response.get_json()
    assert "cibil_score" in data["error"]


def test_predict_invalid_dependents(client):
    """POST /predict returns 400 when dependents is not an integer between 0 and 5."""
    invalid = VALID_APPROVED_APPLICANT.copy()
    invalid["no_of_dependents"] = 9
    response = client.post("/predict", json=invalid)
    assert response.status_code == 400
    data = response.get_json()
    assert "no_of_dependents" in data["error"]


def test_predict_negative_financial(client):
    """POST /predict returns 400 when financial values are negative."""
    invalid = VALID_APPROVED_APPLICANT.copy()
    invalid["income_annum"] = -50000
    response = client.post("/predict", json=invalid)
    assert response.status_code == 400
    data = response.get_json()
    assert "income_annum" in data["error"]


def test_predict_invalid_categorical(client):
    """POST /predict returns 400 for unexpected categorical options."""
    invalid = VALID_APPROVED_APPLICANT.copy()
    invalid["education"] = "Doctorate"
    response = client.post("/predict", json=invalid)
    assert response.status_code == 400
    data = response.get_json()
    assert "education" in data["error"]


def test_predict_non_json(client):
    """POST /predict returns 400 when payload is not JSON."""
    response = client.post("/predict", data="hello world", content_type="text/plain")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_method_not_allowed(client):
    """GET /predict returns 405 Method Not Allowed in JSON format."""
    response = client.get("/predict")
    assert response.status_code == 405
    data = response.get_json()
    assert "error" in data


def test_cors_headers(client):
    """CORS headers are set correctly for allowed frontend origins."""
    headers = {"Origin": "http://localhost:5173"}
    response = client.get("/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
