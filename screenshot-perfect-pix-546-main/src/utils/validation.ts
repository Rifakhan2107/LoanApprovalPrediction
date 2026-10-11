import type { LoanApplication, LoanFieldKey, LoanFormErrors, LoanFormValues } from "@/types/loan";

/** Single source of truth for the loan term unit. Must match the training dataset. */
export const LOAN_TERM_UNIT = "years" as const;

export const EMPTY_FORM: LoanFormValues = {
  no_of_dependents: "",
  education: "",
  self_employed: "",
  income_annum: "",
  loan_amount: "",
  loan_term: "",
  cibil_score: "",
  residential_assets_value: "",
  commercial_assets_value: "",
  luxury_assets_value: "",
  bank_asset_value: "",
};

const NUMERIC_KEYS: LoanFieldKey[] = [
  "no_of_dependents",
  "income_annum",
  "loan_amount",
  "loan_term",
  "cibil_score",
  "residential_assets_value",
  "commercial_assets_value",
  "luxury_assets_value",
  "bank_asset_value",
];

export function validateField(key: LoanFieldKey, raw: string): string | undefined {
  const v = raw.trim();
  if (key === "education") {
    if (!v) return "Please select an education level.";
    return v === "Graduate" || v === "Not Graduate"
      ? undefined
      : "Select Graduate or Not Graduate.";
  }
  if (key === "self_employed") {
    if (!v) return "Please select Yes or No.";
    return v === "Yes" || v === "No" ? undefined : "Select Yes or No.";
  }
  if (!v) return "This field is required.";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Enter a valid number.";
  if (key === "no_of_dependents") {
    if (!Number.isInteger(n)) return "Dependents must be a whole number.";
    if (n < 0 || n > 5) return "Dependents must be between 0 and 5.";
    return undefined;
  }
  if (key === "cibil_score") {
    if (n < 300 || n > 900) return "CIBIL score must be between 300 and 900.";
    return undefined;
  }
  if (key === "loan_term") {
    if (n <= 0) return "Loan term must be greater than 0.";
    return undefined;
  }
  if (n < 0) return "Value cannot be negative.";
  return undefined;
}

export function validateForm(values: LoanFormValues): LoanFormErrors {
  const errors: LoanFormErrors = {};
  (Object.keys(values) as LoanFieldKey[]).forEach((k) => {
    const e = validateField(k, values[k]);
    if (e) errors[k] = e;
  });
  return errors;
}

/** Converts validated form strings to a typed application. Call only after validateForm returns no errors. */
export function toApplication(values: LoanFormValues): LoanApplication {
  const num = (k: LoanFieldKey) => Number(values[k].trim());
  void NUMERIC_KEYS;
  return {
    no_of_dependents: num("no_of_dependents"),
    education: values.education.trim() as LoanApplication["education"],
    self_employed: values.self_employed.trim() as LoanApplication["self_employed"],
    income_annum: num("income_annum"),
    loan_amount: num("loan_amount"),
    loan_term: num("loan_term"),
    cibil_score: num("cibil_score"),
    residential_assets_value: num("residential_assets_value"),
    commercial_assets_value: num("commercial_assets_value"),
    luxury_assets_value: num("luxury_assets_value"),
    bank_asset_value: num("bank_asset_value"),
  };
}
