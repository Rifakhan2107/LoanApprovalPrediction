export type Education = "Graduate" | "Not Graduate";
export type YesNo = "Yes" | "No";
export type LoanOutcome = "Approved" | "Rejected";

/** Exactly the 11 keys the Flask /predict endpoint expects. */
export interface LoanApplication {
  no_of_dependents: number;
  education: Education;
  self_employed: YesNo;
  income_annum: number;
  loan_amount: number;
  loan_term: number;
  cibil_score: number;
  residential_assets_value: number;
  commercial_assets_value: number;
  luxury_assets_value: number;
  bank_asset_value: number;
}

export type LoanFieldKey = keyof LoanApplication;
export type LoanFormValues = Record<LoanFieldKey, string>;
export type LoanFormErrors = Partial<Record<LoanFieldKey, string>>;

export interface PredictionResult {
  prediction: LoanOutcome;
  /** Only present when backend returned a finite number in [0, 1]. */
  approval_probability?: number;
  message?: string;
}

export type ApiErrorKind =
  "missing_base_url" | "network" | "timeout" | "http_status" | "invalid_json" | "invalid_shape";

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
}

export type PredictResponse = { ok: true; data: PredictionResult } | { ok: false; error: ApiError };

export interface HealthResult {
  status: string;
  message?: string;
  model?: string;
  accuracy?: number;
}

export type HealthResponse = { ok: true; data: HealthResult } | { ok: false; error: ApiError };

export interface ModelMetric {
  model: string;
  accuracy: number; // percent
  precision: number;
  recall: number;
  f1: number;
}

export interface DemoRecord {
  reference: string;
  date: string; // ISO
  income_annum: number;
  loan_amount: number;
  loan_term: number;
  cibil_score: number;
  education: Education;
  self_employed: YesNo;
  no_of_dependents: number;
  outcome: LoanOutcome;
}

export interface PredictionRecord extends LoanApplication {
  reference: string;
  date: string; // ISO timestamp
  outcome: LoanOutcome;
  approval_probability?: number;
}
