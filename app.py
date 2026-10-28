import os
import joblib
import pandas as pd
import streamlit as st

# Configure page metadata and layout
st.set_page_config(
    page_title="Loan Approval Prediction",
    page_icon="🏦",
    layout="wide"
)

# ---------------------------------------------------------------------------
# Reliable Model Path Resolution & Initialization
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "loan_model.pkl")
INFO_PATH = os.path.join(BASE_DIR, "models", "model_info.pkl")
COMPARISON_PATH = os.path.join(BASE_DIR, "outputs", "model_comparison.csv")
GRAPH_PATH = os.path.join(BASE_DIR, "outputs", "model_comparison.png")
MATRIX_PATH = os.path.join(BASE_DIR, "outputs", "confusion_matrix.png")


@st.cache_resource
def load_model():
    """Load the trained machine learning pipeline and metadata."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. "
            "Please run 'python train_model.py' first."
        )

    if not os.path.exists(INFO_PATH):
        raise FileNotFoundError(
            f"Model information not found at {INFO_PATH}. "
            "Please run 'python train_model.py' first."
        )

    return (
        joblib.load(MODEL_PATH),
        joblib.load(INFO_PATH)
    )


try:
    model, model_info = load_model()
except Exception as error:
    st.error(f"Failed to load machine learning model: {error}")
    st.stop()

# Exact 11 features expected by the trained pipeline
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


# ---------------------------------------------------------------------------
# Preprocessing Helper
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


# ---------------------------------------------------------------------------
# Sample Profile Presets for Quick Testing & Demonstration
# ---------------------------------------------------------------------------
SAMPLE_APPROVED = {
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 9600000.0,
    "loan_amount": 29900000.0,
    "loan_term": 12.0,
    "cibil_score": 778,
    "residential_assets_value": 2400000.0,
    "commercial_assets_value": 17600000.0,
    "luxury_assets_value": 22700000.0,
    "bank_asset_value": 8000000.0,
}

SAMPLE_REJECTED = {
    "no_of_dependents": 0,
    "education": "Not Graduate",
    "self_employed": "Yes",
    "income_annum": 4100000.0,
    "loan_amount": 12200000.0,
    "loan_term": 8.0,
    "cibil_score": 417,
    "residential_assets_value": 2700000.0,
    "commercial_assets_value": 2200000.0,
    "luxury_assets_value": 8800000.0,
    "bank_asset_value": 3300000.0,
}

DEFAULT_VALUES = {
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 5000000.0,
    "loan_amount": 15000000.0,
    "loan_term": 10.0,
    "cibil_score": 750,
    "residential_assets_value": 2500000.0,
    "commercial_assets_value": 1500000.0,
    "luxury_assets_value": 2000000.0,
    "bank_asset_value": 1000000.0,
}


def apply_sample(sample_dict):
    for key, val in sample_dict.items():
        st.session_state[f"form_{key}"] = val


# Initialize session state if not set
for key, val in DEFAULT_VALUES.items():
    if f"form_{key}" not in st.session_state:
        st.session_state[f"form_{key}"] = val


# ---------------------------------------------------------------------------
# UI Layout
# ---------------------------------------------------------------------------
st.title("🏦 Loan Approval Prediction System")
st.write(
    "Enter applicant financial and asset details to receive a machine learning "
    "prediction based on the trained classification model."
)

st.warning(
    "This application is an educational mini-project for demonstration purposes. "
    "Its prediction is not an official banking credit decision."
)

st.divider()

# Model Metadata Cards
st.subheader("Model Information")
col_info1, col_info2, col_info3 = st.columns(3)

with col_info1:
    st.metric("Selected Algorithm", model_info.get("model_name", "Random Forest"))

with col_info2:
    accuracy_val = model_info.get("accuracy", 0.0)
    st.metric("Test Accuracy", f"{accuracy_val * 100:.2f}%")

with col_info3:
    st.metric("Feature Dimensions", f"{len(EXPECTED_FEATURES)} Features")

st.divider()

# Sample Profile Quick Fill Buttons
st.subheader("Applicant Details")
st.write("Fill in the fields below or click a button to load a sample profile:")

btn_col1, btn_col2, btn_col3 = st.columns(3)
with btn_col1:
    if st.button("📋 Load Sample: Approved Profile", use_container_width=True):
        apply_sample(SAMPLE_APPROVED)
        st.rerun()

with btn_col2:
    if st.button("📋 Load Sample: Rejected Profile", use_container_width=True):
        apply_sample(SAMPLE_REJECTED)
        st.rerun()

with btn_col3:
    if st.button("🔄 Reset to Defaults", use_container_width=True):
        apply_sample(DEFAULT_VALUES)
        st.rerun()

# ---------------------------------------------------------------------------
# Prediction Form with Exactly 11 Features
# ---------------------------------------------------------------------------
with st.form("loan_application_form"):
    tab1, tab2, tab3 = st.tabs([
        "1. Applicant Profile",
        "2. Loan & Credit Score",
        "3. Asset Values"
    ])

    with tab1:
        st.markdown("**Personal and employment details of the applicant:**")
        col_app1, col_app2, col_app3 = st.columns(3)

        with col_app1:
            dep_opts = [0, 1, 2, 3, 4, 5]
            current_dep = int(st.session_state.get("form_no_of_dependents", 2))
            dep_index = dep_opts.index(current_dep) if current_dep in dep_opts else 2
            no_of_dependents = st.selectbox(
                "Number of Dependents",
                options=dep_opts,
                index=dep_index,
                help="Whole number of dependents (0 to 5)."
            )

        with col_app2:
            edu_opts = ["Graduate", "Not Graduate"]
            current_edu = st.session_state.get("form_education", "Graduate")
            edu_index = edu_opts.index(current_edu) if current_edu in edu_opts else 0
            education = st.selectbox(
                "Education Level",
                options=edu_opts,
                index=edu_index,
                help="Applicant's highest level of formal education."
            )

        with col_app3:
            se_opts = ["No", "Yes"]
            current_se = st.session_state.get("form_self_employed", "No")
            se_index = se_opts.index(current_se) if current_se in se_opts else 0
            self_employed = st.selectbox(
                "Self Employed",
                options=se_opts,
                index=se_index,
                help="Whether the applicant is self-employed or salaried."
            )

    with tab2:
        st.markdown("**Income, loan requirements, and credit score:**")
        col_fin1, col_fin2 = st.columns(2)

        with col_fin1:
            income_annum = st.number_input(
                "Annual Income (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_income_annum", 5000000.0)),
                step=50000.0,
                format="%.0f",
                help="Applicant's total yearly income in Indian Rupees."
            )

            loan_amount = st.number_input(
                "Loan Amount Requested (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_loan_amount", 15000000.0)),
                step=100000.0,
                format="%.0f",
                help="Total loan amount requested in Indian Rupees."
            )

        with col_fin2:
            loan_term = st.number_input(
                "Loan Term (Years)",
                min_value=1.0,
                max_value=30.0,
                value=float(st.session_state.get("form_loan_term", 10.0)),
                step=1.0,
                format="%.0f",
                help="Loan repayment tenure in years (e.g. 1 to 20 years)."
            )

            cibil_score = st.number_input(
                "CIBIL Credit Score (300 - 900)",
                min_value=300,
                max_value=900,
                value=int(st.session_state.get("form_cibil_score", 750)),
                step=1,
                help="Credit score between 300 (poor) and 900 (excellent)."
            )

    with tab3:
        st.markdown("**Valuation of applicant's tangible and financial assets:**")
        col_asset1, col_asset2 = st.columns(2)

        with col_asset1:
            residential_assets_value = st.number_input(
                "Residential Assets Value (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_residential_assets_value", 2500000.0)),
                step=50000.0,
                format="%.0f",
                help="Estimated market value of owned residential properties."
            )

            commercial_assets_value = st.number_input(
                "Commercial Assets Value (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_commercial_assets_value", 1500000.0)),
                step=50000.0,
                format="%.0f",
                help="Estimated market value of owned commercial properties."
            )

        with col_asset2:
            luxury_assets_value = st.number_input(
                "Luxury Assets Value (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_luxury_assets_value", 2000000.0)),
                step=50000.0,
                format="%.0f",
                help="Total value of luxury assets including vehicles and jewellery."
            )

            bank_asset_value = st.number_input(
                "Bank Asset Value (₹)",
                min_value=0.0,
                value=float(st.session_state.get("form_bank_asset_value", 1000000.0)),
                step=50000.0,
                format="%.0f",
                help="Liquid bank balances, fixed deposits, and savings."
            )

    submitted = st.form_submit_button(
        "🚀 Predict Loan Outcome",
        use_container_width=True
    )


# ---------------------------------------------------------------------------
# Prediction Execution & Result Handling
# ---------------------------------------------------------------------------
if submitted:
    # Validate user inputs before passing to model
    validation_errors = []

    if loan_amount <= 0:
        validation_errors.append("Loan amount must be greater than ₹0.")
    if loan_term <= 0:
        validation_errors.append("Loan term must be greater than 0 years.")
    if cibil_score < 300 or cibil_score > 900:
        validation_errors.append("CIBIL score must be between 300 and 900.")
    if income_annum < 0:
        validation_errors.append("Annual income cannot be negative.")
    if (
        residential_assets_value < 0 or
        commercial_assets_value < 0 or
        luxury_assets_value < 0 or
        bank_asset_value < 0
    ):
        validation_errors.append("Asset values cannot be negative.")

    if validation_errors:
        st.divider()
        st.subheader("⚠️ Validation Error")
        for err in validation_errors:
            st.error(err)
    else:
        # Preprocess features exactly as trained
        applicant_data = {
            "no_of_dependents": int(no_of_dependents),
            "education": normalize_categorical(education, "education"),
            "self_employed": normalize_categorical(self_employed, "self_employed"),
            "income_annum": float(income_annum),
            "loan_amount": float(loan_amount),
            "loan_term": float(loan_term),
            "cibil_score": float(cibil_score),
            "residential_assets_value": float(residential_assets_value),
            "commercial_assets_value": float(commercial_assets_value),
            "luxury_assets_value": float(luxury_assets_value),
            "bank_asset_value": float(bank_asset_value),
        }

        # Build DataFrame with exact feature ordering expected by pipeline
        input_df = pd.DataFrame([applicant_data])[EXPECTED_FEATURES]

        st.divider()
        st.subheader("Prediction Result")

        try:
            # Model prediction: 1 = Approved, 0 = Rejected
            raw_pred = int(model.predict(input_df)[0])

            if raw_pred == 1:
                st.success("### ✅ Predicted Outcome: **Loan Approved**")
            else:
                st.error("### ❌ Predicted Outcome: **Loan Rejected**")

            # Calculate and display approval probability if available
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(input_df)[0]
                classifier = model.named_steps.get("classifier")
                if classifier and hasattr(classifier, "classes_"):
                    classes = list(classifier.classes_)
                    if 1 in classes:
                        approval_prob = float(probabilities[classes.index(1)])
                        st.write(f"**Approval Probability:** {approval_prob * 100:.2f}%")
                        st.progress(approval_prob)
                        st.caption(
                            "This probability estimate reflects the model's confidence based on historical data."
                        )

            # Display formatted summary of entered values
            with st.expander("🔍 View Submitted Applicant Details"):
                summary_data = {
                    "Feature": [
                        "Number of Dependents",
                        "Education",
                        "Self Employed",
                        "Annual Income",
                        "Loan Amount",
                        "Loan Term",
                        "CIBIL Score",
                        "Residential Assets",
                        "Commercial Assets",
                        "Luxury Assets",
                        "Bank Assets",
                    ],
                    "Entered Value": [
                        str(no_of_dependents),
                        education,
                        self_employed,
                        f"₹{income_annum:,.0f}",
                        f"₹{loan_amount:,.0f}",
                        f"{loan_term:.0f} years",
                        str(cibil_score),
                        f"₹{residential_assets_value:,.0f}",
                        f"₹{commercial_assets_value:,.0f}",
                        f"₹{luxury_assets_value:,.0f}",
                        f"₹{bank_asset_value:,.0f}",
                    ]
                }
                st.dataframe(pd.DataFrame(summary_data), use_container_width=True, hide_index=True)

        except Exception as error:
            st.error(f"Prediction error occurred: {error}")


# ---------------------------------------------------------------------------
# Model Comparison & Evaluation Artifacts
# ---------------------------------------------------------------------------
st.divider()
st.subheader("Model Performance Comparison")

if os.path.exists(COMPARISON_PATH):
    comparison_df = pd.read_csv(COMPARISON_PATH)
    st.dataframe(
        comparison_df.style.format({
            "Accuracy": "{:.2%}",
            "Precision": "{:.3f}",
            "Recall": "{:.3f}",
            "F1 Score": "{:.3f}"
        }),
        use_container_width=True,
        hide_index=True
    )

col_chart1, col_chart2 = st.columns(2)

with col_chart1:
    if os.path.exists(GRAPH_PATH):
        st.image(
            GRAPH_PATH,
            caption="Comparison of Machine Learning Algorithms",
            use_container_width=True
        )

with col_chart2:
    if os.path.exists(MATRIX_PATH):
        st.image(
            MATRIX_PATH,
            caption="Confusion Matrix for Selected Best Model",
            use_container_width=True
        )

st.divider()
st.caption("B.Tech CSE | Machine Learning Mini-Project — Loan Approval Prediction")
