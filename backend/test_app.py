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


def test_predict_boundary_cibil_scores(client):
    """POST /predict accepts CIBIL exactly at boundaries 300 and 900."""
    low_cibil = VALID_APPROVED_APPLICANT.copy()
    low_cibil["cibil_score"] = 300
    res_low = client.post("/predict", json=low_cibil)
    assert res_low.status_code == 200

    high_cibil = VALID_APPROVED_APPLICANT.copy()
    high_cibil["cibil_score"] = 900
    res_high = client.post("/predict", json=high_cibil)
    assert res_high.status_code == 200

    over_cibil = VALID_APPROVED_APPLICANT.copy()
    over_cibil["cibil_score"] = 901
    res_over = client.post("/predict", json=over_cibil)
    assert res_over.status_code == 400


def test_predict_boundary_dependents(client):
    """POST /predict accepts dependents at boundaries 0 and 5, but rejects > 5."""
    dep_0 = VALID_APPROVED_APPLICANT.copy()
    dep_0["no_of_dependents"] = 0
    res_0 = client.post("/predict", json=dep_0)
    assert res_0.status_code == 200

    dep_5 = VALID_APPROVED_APPLICANT.copy()
    dep_5["no_of_dependents"] = 5
    res_5 = client.post("/predict", json=dep_5)
    assert res_5.status_code == 200

    dep_neg = VALID_APPROVED_APPLICANT.copy()
    dep_neg["no_of_dependents"] = -1
    res_neg = client.post("/predict", json=dep_neg)
    assert res_neg.status_code == 400


def test_predict_zero_asset_values(client):
    """POST /predict accepts 0 values for monetary assets."""
    zero_assets = VALID_APPROVED_APPLICANT.copy()
    zero_assets["commercial_assets_value"] = 0
    zero_assets["residential_assets_value"] = 0
    zero_assets["bank_asset_value"] = 0
    response = client.post("/predict", json=zero_assets)
    assert response.status_code == 200
    data = response.get_json()
    assert data["prediction"] in ("Approved", "Rejected")


def test_predict_invalid_loan_term(client):
    """POST /predict rejects 0 or negative loan_term."""
    zero_term = VALID_APPROVED_APPLICANT.copy()
    zero_term["loan_term"] = 0
    res_0 = client.post("/predict", json=zero_term)
    assert res_0.status_code == 400

    neg_term = VALID_APPROVED_APPLICANT.copy()
    neg_term["loan_term"] = -5
    res_neg = client.post("/predict", json=neg_term)
    assert res_neg.status_code == 400


def test_predict_nan_inf_rejected(client):
    """POST /predict rejects NaN or Infinity values."""
    nan_app = VALID_APPROVED_APPLICANT.copy()
    nan_app["income_annum"] = "NaN"
    res_nan = client.post("/predict", json=nan_app)
    assert res_nan.status_code == 400

    inf_app = VALID_APPROVED_APPLICANT.copy()
    inf_app["loan_amount"] = "Infinity"
    res_inf = client.post("/predict", json=inf_app)
    assert res_inf.status_code == 400


def test_predict_empty_or_whitespace_fields(client):
    """POST /predict rejects empty strings or whitespace-only inputs."""
    empty_app = VALID_APPROVED_APPLICANT.copy()
    empty_app["education"] = "   "
    res = client.post("/predict", json=empty_app)
    assert res.status_code == 400
    assert "Missing required fields" in res.get_json()["error"]

