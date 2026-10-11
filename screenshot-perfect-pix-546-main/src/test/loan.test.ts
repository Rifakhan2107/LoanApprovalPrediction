import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPayload, checkApiHealth, parsePredictionBody, predictLoan } from "@/services/api";
import { EMPTY_FORM, toApplication, validateField, validateForm } from "@/utils/validation";
import { MODEL_METRICS, RANDOM_FOREST_CONFUSION_MATRIX } from "@/data/metrics";
import { DEMO_SUMMARY, DEMO_RECORDS } from "@/data/demoData";
import { formatINR } from "@/utils/format";

const filled = {
  ...EMPTY_FORM,
  no_of_dependents: "2",
  education: "Graduate",
  self_employed: "No",
  income_annum: "500000",
  loan_amount: "1500000",
  loan_term: "12",
  cibil_score: "750",
  residential_assets_value: "1000000",
  commercial_assets_value: "200000",
  luxury_assets_value: "300000",
  bank_asset_value: "250000",
};

describe("validation", () => {
  it("dependents must be integer 0-5", () => {
    expect(validateField("no_of_dependents", "6")).toBeTruthy();
    expect(validateField("no_of_dependents", "1.5")).toBeTruthy();
    expect(validateField("no_of_dependents", "5")).toBeUndefined();
  });
  it("cibil must be 300-900", () => {
    expect(validateField("cibil_score", "299")).toBeTruthy();
    expect(validateField("cibil_score", "901")).toBeTruthy();
    expect(validateField("cibil_score", "300")).toBeUndefined();
  });
  it("loan term must be > 0", () => expect(validateField("loan_term", "0")).toBeTruthy());
  it("rejects negatives and empty", () => {
    expect(validateField("income_annum", "-1")).toBeTruthy();
    expect(validateField("bank_asset_value", "")).toBeTruthy();
  });
  it("empty form has errors on all 11 fields", () =>
    expect(Object.keys(validateForm(EMPTY_FORM))).toHaveLength(11));
  it("converts numeric fields to numbers", () => {
    const a = toApplication(filled);
    expect(a.income_annum).toBe(500000);
    expect(typeof a.cibil_score).toBe("number");
  });
});

describe("api", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it("payload has exactly 11 keys", () => {
    expect(Object.keys(buildPayload({ ...toApplication(filled), extra: 1 } as never))).toHaveLength(
      11,
    );
  });
  it("normalizes prediction and ignores invalid probability", () => {
    expect(parsePredictionBody({ prediction: " approved ", approval_probability: 1.4 })).toEqual({
      prediction: "Approved",
    });
    expect(
      parsePredictionBody({ prediction: "Rejected", approval_probability: 0.2 })
        ?.approval_probability,
    ).toBe(0.2);
    expect(parsePredictionBody({ prediction: "maybe" })).toBeNull();
  });
  it("missing base URL returns error, no prediction", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const r = await predictLoan(toApplication(filled));
    expect(r.ok).toBe(false);
  });
  it("network failure returns error", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5000/");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fail")));
    const r = await predictLoan(toApplication(filled));
    expect(r).toMatchObject({ ok: false, error: { kind: "network" } });
  });
  it("checkApiHealth fails when base URL missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const r = await checkApiHealth();
    expect(r.ok).toBe(false);
  });
  it("checkApiHealth returns ok on successful response", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5000/");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "healthy" }),
      }),
    );
    const r = await checkApiHealth();
    expect(r).toEqual({ ok: true, data: { status: "healthy" } });
  });
  it("checkApiHealth parses model and accuracy from backend response", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "healthy",
          message: "Loan Approval Prediction API is running",
          model: "Random Forest",
          accuracy: 0.9789,
        }),
      }),
    );
    const r = await checkApiHealth();
    expect(r).toEqual({
      ok: true,
      data: {
        status: "healthy",
        message: "Loan Approval Prediction API is running",
        model: "Random Forest",
        accuracy: 0.9789,
      },
    });
  });
  it("checkApiHealth extracts backend error message on 503 response", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          status: "error",
          message: "Model is not loaded. Please ensure models/loan_model.pkl exists.",
        }),
      }),
    );
    const r = await checkApiHealth();
    expect(r).toEqual({
      ok: false,
      error: {
        kind: "http_status",
        message: "Model is not loaded. Please ensure models/loan_model.pkl exists.",
      },
    });
  });
  it("predictLoan parses successful prediction and approval probability", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          prediction: "Approved",
          message: "Loan outcome predicted as approved.",
          approval_probability: 0.9701,
        }),
      }),
    );
    const r = await predictLoan(toApplication(filled));
    expect(r).toEqual({
      ok: true,
      data: {
        prediction: "Approved",
        message: "Loan outcome predicted as approved.",
        approval_probability: 0.9701,
      },
    });
  });
  it("predictLoan extracts backend validation error on 400 status", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Field 'cibil_score' must be between 300 and 900.",
        }),
      }),
    );
    const r = await predictLoan(toApplication(filled));
    expect(r).toEqual({
      ok: false,
      error: {
        kind: "http_status",
        message: "Field 'cibil_score' must be between 300 and 900.",
      },
    });
  });
});

describe("data", () => {
  it("metrics match supplied values", () => {
    expect(MODEL_METRICS.map((m) => m.accuracy)).toEqual([92.39, 97.54, 97.89]);
    expect(MODEL_METRICS[2]).toMatchObject({ precision: 0.985, recall: 0.981, f1: 0.983 });
  });
  it("confusion matrix values match Random Forest test set", () => {
    expect(RANDOM_FOREST_CONFUSION_MATRIX).toEqual({
      tp: 521,
      tn: 315,
      fp: 8,
      fn: 10,
      total: 854,
    });
  });
  it("demo counts are consistent", () => {
    expect(DEMO_SUMMARY.approved + DEMO_SUMMARY.rejected).toBe(DEMO_RECORDS.length);
  });
  it("INR uses Indian grouping", () => expect(formatINR(1500000)).toBe("₹15,00,000"));
});
