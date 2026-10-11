
import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, ConfusionMatrixDisplay, classification_report
)

os.makedirs("models", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

print("Loading dataset...")
df = pd.read_csv("loan_approval_dataset.csv")

# Clean column names, including leading/trailing spaces
df.columns = df.columns.str.strip().str.lower()

print("Dataset loaded!")
print("Columns found:", df.columns.tolist())

target_column = "loan_status"

if target_column not in df.columns:
    raise ValueError(
        f"Expected '{target_column}', but found: {df.columns.tolist()}"
    )


# Remove rows without a target value
df = df.dropna(subset=[target_column]).copy()

# Remove duplicate rows
duplicates = df.duplicated().sum()
print("Duplicate rows found:", duplicates)

df = df.drop_duplicates().copy()

# Display missing values in each column
print("\nMissing values before preprocessing:")
print(df.isnull().sum())

# Remove unnecessary ID column
if "loan_id" in df.columns:
    df = df.drop(columns=["loan_id"])

# Approved = 1, Rejected = 0
status = df[target_column].astype(str).str.strip().str.lower()

mapping = {
    "approved": 1,
    "rejected": 0,
    "approve": 1,
    "reject": 0,
    "yes": 1,
    "no": 0,
    "y": 1,
    "n": 0,
    "1": 1,
    "0": 0
}

y = status.map(mapping)

if y.isna().any():
    raise ValueError(f"Unexpected loan statuses: {status.unique()}")

y = y.astype(int)
X = df.drop(columns=[target_column])

# Remove columns with no values
empty_columns = X.columns[X.isna().all()].tolist()
if empty_columns:
    X = X.drop(columns=empty_columns)

numeric_features = X.select_dtypes(include=["number"]).columns.tolist()
categorical_features = X.select_dtypes(exclude=["number"]).columns.tolist()

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features)
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

models = {
    "Logistic Regression": LogisticRegression(
        max_iter=2000, class_weight="balanced"
    ),
    "Decision Tree": DecisionTreeClassifier(
        max_depth=8, class_weight="balanced", random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=200, max_depth=12,
        class_weight="balanced", random_state=42
    )
}

results = []
trained_models = {}

for name, classifier in models.items():
    print(f"\nTraining {name}...")

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])

    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, zero_division=0)
    recall = recall_score(y_test, predictions, zero_division=0)
    f1 = f1_score(y_test, predictions, zero_division=0)

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"Precision: {precision:.3f}")
    print(f"Recall: {recall:.3f}")
    print(f"F1 Score: {f1:.3f}")

    print(classification_report(y_test, predictions, zero_division=0))

    results.append({
        "Model": name,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1
    })

    trained_models[name] = pipeline

results_df = pd.DataFrame(results).sort_values(
    "Accuracy", ascending=False
).reset_index(drop=True)

print("\nMODEL COMPARISON")
print(results_df.to_string(index=False))
results_df.to_csv("outputs/model_comparison.csv", index=False)

best_name = results_df.iloc[0]["Model"]
best_model = trained_models[best_name]
best_accuracy = float(results_df.iloc[0]["Accuracy"])

joblib.dump(best_model, "models/loan_model.pkl")
joblib.dump({
    "model_name": best_name,
    "accuracy": best_accuracy,
    "features": X.columns.tolist()
}, "models/model_info.pkl")

plt.figure(figsize=(9, 5))
plt.bar(results_df["Model"], results_df["Accuracy"])
plt.title("Loan Approval Model Comparison")
plt.xlabel("Machine Learning Algorithm")
plt.ylabel("Test Accuracy")
plt.ylim(0, 1)
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig("outputs/model_comparison.png", dpi=150)
plt.close()

ConfusionMatrixDisplay.from_predictions(
    y_test,
    best_model.predict(X_test),
    labels=[0, 1],
    display_labels=["Rejected", "Approved"]
)
plt.title("Confusion Matrix - " + best_name)
plt.tight_layout()
plt.savefig("outputs/confusion_matrix.png", dpi=150)
plt.close()

print("\nTRAINING COMPLETED SUCCESSFULLY!")
print("Selected model:", best_name)
print("Saved files in models/ and outputs/")
