
import os
import joblib
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="Loan Approval Prediction",
    page_icon="🏦",
    layout="wide"
)

MODEL_PATH = "models/loan_model.pkl"
INFO_PATH = "models/model_info.pkl"


@st.cache_resource
def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Trained model not found. Please run "
            "python train_model.py first."
        )

    if not os.path.exists(INFO_PATH):
        raise FileNotFoundError(
            "Model information not found. Please run "
            "python train_model.py first."
        )

    return (
        joblib.load(MODEL_PATH),
        joblib.load(INFO_PATH)
    )


try:
    model, model_info = load_model()
except FileNotFoundError as error:
    st.error(str(error))
    st.stop()


st.title("🏦 Loan Approval Prediction System")
st.write(
    "Enter applicant details to receive a machine-learning "
    "prediction based on historical loan application data."
)

st.warning(
    "This is an educational project. Its prediction is not "
    "an actual bank decision."
)

st.divider()

st.subheader("Model Information")

col1, col2 = st.columns(2)

with col1:
    st.metric("Selected Algorithm", model_info["model_name"])

with col2:
    st.metric(
        "Test Accuracy",
        f"{model_info['accuracy'] * 100:.2f}%"
    )

st.divider()
st.subheader("Applicant Details")

with st.form("loan_application"):
    left, right = st.columns(2)

    with left:
        gender = st.selectbox("Gender", ["Male", "Female"])
        married = st.selectbox("Married", ["Yes", "No"])
        dependents = st.selectbox(
            "Number of Dependents", ["0", "1", "2", "3+"]
        )
        education = st.selectbox(
            "Education", ["Graduate", "Not Graduate"]
        )
        self_employed = st.selectbox(
            "Self Employed", ["Yes", "No"]
        )

    with right:
        applicant_income = st.number_input(
            "Applicant Income (dataset units)",
            min_value=0.0,
            value=5000.0,
            step=500.0
        )

        coapplicant_income = st.number_input(
            "Co-applicant Income (dataset units)",
            min_value=0.0,
            value=0.0,
            step=500.0
        )

        loan_amount = st.number_input(
            "Loan Amount (dataset units)",
            min_value=0.0,
            value=100.0,
            step=10.0
        )

        loan_term = st.number_input(
            "Loan Term (Months)",
            min_value=1.0,
            value=360.0,
            step=12.0
        )

        credit_history = st.selectbox(
            "Credit History",
            [1.0, 0.0],
            format_func=lambda x: (
                "Positive / Available" if x == 1.0
                else "Negative / Unavailable"
            )
        )

    property_area = st.selectbox(
        "Property Area", ["Urban", "Semiurban", "Rural"]
    )

    submitted = st.form_submit_button(
        "Predict Loan Outcome",
        use_container_width=True
    )


if submitted:
    applicant_data = {
        "Gender": gender,
        "Married": married,
        "Dependents": dependents,
        "Education": education,
        "Self_Employed": self_employed,
        "ApplicantIncome": applicant_income,
        "CoapplicantIncome": coapplicant_income,
        "LoanAmount": loan_amount,
        "Loan_Amount_Term": loan_term,
        "Credit_History": credit_history,
        "Property_Area": property_area
    }

    input_df = pd.DataFrame([applicant_data])
    input_df = input_df.reindex(
        columns=model_info["features"]
    )

    st.divider()
    st.subheader("Prediction Result")

    try:
        prediction = int(model.predict(input_df)[0])

        if prediction == 1:
            st.success("Predicted Outcome: Loan Approved")
        else:
            st.error("Predicted Outcome: Loan Not Approved")

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0]
            classes = list(
                model.named_steps["classifier"].classes_
            )

            if 1 in classes:
                probability = float(
                    probabilities[classes.index(1)]
                )

                st.write("Model-estimated approval probability")
                st.progress(probability)
                st.write(f"{probability * 100:.2f}%")

                st.caption(
                    "This is an estimate from the model, not a "
                    "guarantee or a calibrated creditworthiness score."
                )

        with st.expander("View Entered Applicant Details"):
            st.dataframe(input_df, use_container_width=True)

    except Exception as error:
        st.error(f"Prediction error: {error}")


st.divider()
st.subheader("Model Performance Comparison")

comparison_path = "outputs/model_comparison.csv"

if os.path.exists(comparison_path):
    comparison_df = pd.read_csv(comparison_path)

    st.dataframe(
        comparison_df.style.format({
            "Accuracy": "{:.2%}",
            "Precision": "{:.2%}",
            "Recall": "{:.2%}",
            "F1 Score": "{:.2%}"
        }),
        use_container_width=True
    )

graph_path = "outputs/model_comparison.png"

if os.path.exists(graph_path):
    st.image(
        graph_path,
        caption="Comparison of Machine-Learning Algorithms"
    )

matrix_path = "outputs/confusion_matrix.png"

if os.path.exists(matrix_path):
    st.image(
        matrix_path,
        caption="Confusion Matrix"
    )

st.divider()
st.caption("B.Tech CSE | Machine Learning Mini-Project")
