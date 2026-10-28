import os
import joblib
import pandas as pd
import pytest
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "loan_model.pkl")
INFO_PATH = os.path.join(BASE_DIR, "models", "model_info.pkl")

EXPECTED_11_FEATURES = [
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
]


@pytest.fixture(scope="module")
def model_and_info():
    assert os.path.exists(MODEL_PATH), f"Model file missing at {MODEL_PATH}"
    assert os.path.exists(INFO_PATH), f"Model info file missing at {INFO_PATH}"
    model = joblib.load(MODEL_PATH)
    info = joblib.load(INFO_PATH)
    return model, info


def test_saved_model_files_and_schema(model_and_info):
    model, info = model_and_info
    assert isinstance(model, Pipeline), "Saved model must be a scikit-learn Pipeline"
    assert "model_name" in info
    assert "accuracy" in info
    assert info["accuracy"] > 0.90
    assert "features" in info
    assert info["features"] == EXPECTED_11_FEATURES


def test_approved_applicant_prediction(model_and_info):
    model, _ = model_and_info
    approved_applicant = pd.DataFrame([{
        "no_of_dependents": 2,
        "education": " Graduate",
        "self_employed": " No",
        "income_annum": 9600000,
        "loan_amount": 29900000,
        "loan_term": 12,
        "cibil_score": 778,
        "residential_assets_value": 2400000,
        "commercial_assets_value": 17600000,
        "luxury_assets_value": 22700000,
        "bank_asset_value": 8000000,
    }])[EXPECTED_11_FEATURES]

    pred = model.predict(approved_applicant)[0]
    assert int(pred) == 1, "Expected class 1 (Loan Approved)"

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(approved_applicant)[0]
        assert len(probs) == 2
        assert probs[1] > 0.5, "Expected approval probability > 50%"


def test_rejected_applicant_prediction(model_and_info):
    model, _ = model_and_info
    rejected_applicant = pd.DataFrame([{
        "no_of_dependents": 0,
        "education": " Not Graduate",
        "self_employed": " Yes",
        "income_annum": 4100000,
        "loan_amount": 12200000,
        "loan_term": 8,
        "cibil_score": 417,
        "residential_assets_value": 2700000,
        "commercial_assets_value": 2200000,
        "luxury_assets_value": 8800000,
        "bank_asset_value": 3300000,
    }])[EXPECTED_11_FEATURES]

    pred = model.predict(rejected_applicant)[0]
    assert int(pred) == 0, "Expected class 0 (Loan Rejected)"

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(rejected_applicant)[0]
        assert probs[0] > 0.5, "Expected rejection probability > 50%"


def test_categorical_normalization():
    # Helper to test normalizer behavior across Streamlit and Flask
    def normalize_categorical(val: str, column_name: str) -> str:
        clean = str(val).strip().lower()
        if column_name == "education":
            if clean == "graduate":
                return " Graduate"
            if clean in ("not graduate", "notgraduate", "non-graduate"):
                return " Not Graduate"
        elif column_name == "self_employed":
            if clean in ("yes", "y", "true", "1"):
                return " Yes"
            if clean in ("no", "n", "false", "0"):
                return " No"
        return str(val)

    assert normalize_categorical("Graduate", "education") == " Graduate"
    assert normalize_categorical("graduate", "education") == " Graduate"
    assert normalize_categorical("Not Graduate", "education") == " Not Graduate"
    assert normalize_categorical("Yes", "self_employed") == " Yes"
    assert normalize_categorical("No", "self_employed") == " No"


def test_streamlit_validation_logic():
    # Helper replicating Streamlit input validation logic
    def validate_inputs(dep, edu, se, income, amount, term, cibil, res, comm, lux, bank):
        errors = []
        if amount <= 0:
            errors.append("Loan amount must be greater than ₹0.")
        if term <= 0:
            errors.append("Loan term must be greater than 0 years.")
        if cibil < 300 or cibil > 900:
            errors.append("CIBIL score must be between 300 and 900.")
        if income < 0:
            errors.append("Annual income cannot be negative.")
        if res < 0 or comm < 0 or lux < 0 or bank < 0:
            errors.append("Asset values cannot be negative.")
        if dep < 0 or dep > 5:
            errors.append("Dependents must be between 0 and 5.")
        if edu not in ("Graduate", "Not Graduate"):
            errors.append("Invalid education.")
        if se not in ("Yes", "No"):
            errors.append("Invalid self employed.")
        return errors

    # Valid profile should have zero errors
    assert len(validate_inputs(2, "Graduate", "No", 5000000, 15000000, 10, 750, 2500000, 1500000, 2000000, 1000000)) == 0

    # Invalid profile
    errs = validate_inputs(7, "Doctorate", "Maybe", -500, 0, 0, 200, -10, -20, -30, -40)
    assert len(errs) >= 6

