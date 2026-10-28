import os
import sys
import math
import logging
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging for server activity
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)

# Configure CORS specifically for local Vite/React frontend development origins
ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# ---------------------------------------------------------------------------
# Reliable Model Path Resolution & Initialization
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "loan_model.pkl"))
MODEL_INFO_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "model_info.pkl"))

model = None
model_info = {}

try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    if not os.path.exists(MODEL_INFO_PATH):
        raise FileNotFoundError(f"Model info file not found at: {MODEL_INFO_PATH}")

    model = joblib.load(MODEL_PATH)
    model_info = joblib.load(MODEL_INFO_PATH)
    logger.info("Successfully loaded model: %s", model_info.get("model_name", "Unknown"))
    logger.info("Test accuracy from training: %.2f%%", model_info.get("accuracy", 0.0) * 100)
    logger.info("Features expected: %s", model_info.get("features", []))
except Exception as exc:
    logger.error("Failed to load model on startup: %s", exc)
    model = None
    model_info = {}

# Exact 11 features expected by the model pipeline in order
EXPECTED_FEATURES = model_info.get("features", [
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
])

# Training mapping: 1 = Approved, 0 = Rejected
LABEL_MAPPING = {
    1: "Approved",
    0: "Rejected"
}


# ---------------------------------------------------------------------------
# Input Validation & Normalization Helpers
# ---------------------------------------------------------------------------
def normalize_categorical(val: str, column_name: str) -> str:
    """
    Normalizes categorical text inputs to match the exact categories
    learned by the trained OneHotEncoder (which preserved leading spaces from dataset CSV).
    """
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


def validate_application_data(data: dict):
    """
    Validates that all 11 required fields are present, have valid types,
    and fall within expected business and training ranges.
    Returns: (cleaned_dict, error_message_or_None)
    """
    if not isinstance(data, dict):
        return None, "Request body must be a valid JSON object."

    # Check for missing required fields (including empty or whitespace-only strings)
    missing_fields = [
        f for f in EXPECTED_FEATURES
        if f not in data or data[f] is None or (isinstance(data[f], str) and data[f].strip() == "")
    ]
    if missing_fields:
        return None, f"Missing required fields: {', '.join(missing_fields)}"

    cleaned = {}

    # Validate categorical: education
    raw_edu = str(data["education"]).strip().lower()
    if raw_edu not in ("graduate", "not graduate", "notgraduate"):
        return None, "Field 'education' must be either 'Graduate' or 'Not Graduate'."
    cleaned["education"] = normalize_categorical(data["education"], "education")

    # Validate categorical: self_employed
    raw_se = str(data["self_employed"]).strip().lower()
    if raw_se not in ("yes", "no", "y", "n"):
        return None, "Field 'self_employed' must be either 'Yes' or 'No'."
    cleaned["self_employed"] = normalize_categorical(data["self_employed"], "self_employed")

    # Validate numeric: no_of_dependents
    try:
        dep = float(data["no_of_dependents"])
        if not math.isfinite(dep) or not dep.is_integer() or dep < 0 or dep > 5:
            return None, "Field 'no_of_dependents' must be an integer between 0 and 5."
        cleaned["no_of_dependents"] = int(dep)
    except (ValueError, TypeError):
        return None, "Field 'no_of_dependents' must be a valid whole number between 0 and 5."

    # Validate numeric: cibil_score
    try:
        cibil = float(data["cibil_score"])
        if not math.isfinite(cibil) or cibil < 300 or cibil > 900:
            return None, "Field 'cibil_score' must be between 300 and 900."
        cleaned["cibil_score"] = cibil
    except (ValueError, TypeError):
        return None, "Field 'cibil_score' must be a valid number between 300 and 900."

    # Validate numeric: loan_term
    try:
        term = float(data["loan_term"])
        if not math.isfinite(term) or term <= 0:
            return None, "Field 'loan_term' must be greater than 0."
        cleaned["loan_term"] = term
    except (ValueError, TypeError):
        return None, "Field 'loan_term' must be a valid number greater than 0."

    # Validate non-negative financial values
    monetary_fields = [
        "income_annum",
        "loan_amount",
        "residential_assets_value",
        "commercial_assets_value",
        "luxury_assets_value",
        "bank_asset_value",
    ]

    for field in monetary_fields:
        try:
            val = float(data[field])
            if not math.isfinite(val) or val < 0:
                return None, f"Field '{field}' cannot be negative."
            cleaned[field] = val
        except (ValueError, TypeError):
            return None, f"Field '{field}' must be a valid numeric amount."

    return cleaned, None


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint: confirms server is up and model is ready.
    """
    if model is None:
        return jsonify({
            "status": "error",
            "message": "Model is not loaded. Please ensure models/loan_model.pkl exists."
        }), 503

    return jsonify({
        "status": "healthy",
        "message": "Loan Approval Prediction API is running",
        "model": model_info.get("model_name", "Random Forest"),
        "accuracy": round(float(model_info.get("accuracy", 0.0)), 4)
    }), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Prediction endpoint: accepts application JSON, validates input,
    runs the pipeline model, and returns prediction and probability.
    """
    if model is None:
        logger.error("Predict called but model is not loaded.")
        return jsonify({
            "error": "Model service is unavailable. Please check server logs."
        }), 503

    # Ensure request body is JSON
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({
            "error": "Invalid request. Expected JSON body with Content-Type: application/json."
        }), 400

    # Validate input data against contract
    cleaned_data, error_msg = validate_application_data(payload)
    if error_msg:
        logger.warning("Validation failed for input: %s", error_msg)
        return jsonify({"error": error_msg}), 400

    try:
        # Create a single-row DataFrame with the exact features and order
        input_df = pd.DataFrame([cleaned_data])[EXPECTED_FEATURES]

        # Execute prediction
        raw_prediction = int(model.predict(input_df)[0])
        outcome = LABEL_MAPPING.get(raw_prediction, "Unknown")

        # Compute probability if model supports predict_proba
        approval_probability = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(input_df)[0]
            classifier = model.named_steps.get("classifier")
            if classifier and hasattr(classifier, "classes_"):
                classes = list(classifier.classes_)
                if 1 in classes:
                    approval_probability = round(float(probs[classes.index(1)]), 4)

        response = {
            "prediction": outcome,
            "message": f"Loan outcome predicted as {outcome.lower()}."
        }

        if approval_probability is not None:
            response["approval_probability"] = approval_probability

        logger.info(
            "Prediction executed successfully: %s (approval_probability: %s)",
            outcome, approval_probability
        )
        return jsonify(response), 200

    except Exception as exc:
        # Log internal detail for developer, but do not expose raw traceback to user
        logger.error("Prediction processing error: %s", exc, exc_info=True)
        return jsonify({
            "error": "An internal error occurred while processing the loan prediction."
        }), 500


# ---------------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------------
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed for this endpoint"}), 405


@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------------------------
# Server Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info("Starting Loan Approval Prediction Flask backend on port %d...", port)
    app.run(host="127.0.0.1", port=port, debug=False)
