import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  clearPredictionHistory,
  computeHistorySummary,
  generateReference,
  getPredictionHistory,
  isValidRecord,
  savePredictionRecord,
  _resetPredictionHistoryForTesting,
  HISTORY_STORAGE_KEY,
} from "@/services/predictionHistory";
import type { LoanApplication, PredictionResult } from "@/types/loan";
import { Route as HistoryRoute } from "@/routes/history";
import { Route as IndexRoute } from "@/routes/index";

// Mock @tanstack/react-router Link and createFileRoute
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: {
      to?: string;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useRouterState: vi.fn(() => "/"),
  };
});

const sampleApp1: LoanApplication = {
  no_of_dependents: 2,
  education: "Graduate",
  self_employed: "No",
  income_annum: 9600000,
  loan_amount: 29900000,
  loan_term: 12,
  cibil_score: 778,
  residential_assets_value: 2400000,
  commercial_assets_value: 17600000,
  luxury_assets_value: 22700000,
  bank_asset_value: 8000000,
};

const sampleApp2: LoanApplication = {
  no_of_dependents: 0,
  education: "Not Graduate",
  self_employed: "Yes",
  income_annum: 4100000,
  loan_amount: 12200000,
  loan_term: 8,
  cibil_score: 417,
  residential_assets_value: 2700000,
  commercial_assets_value: 2200000,
  luxury_assets_value: 8800000,
  bank_asset_value: 3300000,
};

const approvedResult: PredictionResult = {
  prediction: "Approved",
  approval_probability: 0.95,
  message: "Loan outcome predicted as approved.",
};

const rejectedResult: PredictionResult = {
  prediction: "Rejected",
  approval_probability: 0.15,
  message: "Loan outcome predicted as rejected.",
};

describe("predictionHistory service", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  afterEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  it("returns an empty array when localStorage is empty", () => {
    const history = getPredictionHistory();
    expect(history).toEqual([]);
  });

  it("generates a unique reference starting with PRED-", () => {
    const ref1 = generateReference();
    const ref2 = generateReference();
    expect(ref1).toMatch(/^PRED-\d+-[A-Z0-9]+$/);
    expect(ref2).toMatch(/^PRED-\d+-[A-Z0-9]+$/);
    expect(ref1).not.toBe(ref2);
  });

  it("validates valid PredictionRecord correctly", () => {
    const valid = {
      reference: "PRED-123456",
      date: new Date().toISOString(),
      ...sampleApp1,
      outcome: "Approved",
      approval_probability: 0.9,
    };
    expect(isValidRecord(valid)).toBe(true);
  });

  it("rejects invalid or corrupted records", () => {
    expect(isValidRecord(null)).toBe(false);
    expect(isValidRecord("not an object")).toBe(false);
    expect(isValidRecord({ reference: "PRED-1" })).toBe(false);
    expect(isValidRecord({ ...sampleApp1, outcome: "Maybe" })).toBe(false);
    expect(isValidRecord({ ...sampleApp1, outcome: "Approved", date: "invalid-date" })).toBe(false);
  });

  it("saves successful predictions to localStorage with all 11 fields", () => {
    const saved = savePredictionRecord(sampleApp1, approvedResult);

    expect(saved.reference).toMatch(/^PRED-/);
    expect(saved.outcome).toBe("Approved");
    expect(saved.approval_probability).toBe(0.95);
    expect(saved.cibil_score).toBe(778);
    expect(saved.income_annum).toBe(9600000);
    expect(saved.residential_assets_value).toBe(2400000);

    const history = getPredictionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].reference).toBe(saved.reference);

    // Verify localStorage item directly
    const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].reference).toBe(saved.reference);
  });

  it("sorts records newest first", async () => {
    savePredictionRecord(sampleApp1, approvedResult);
    // Small delay to ensure distinct timestamp
    await new Promise((r) => setTimeout(r, 10));
    const record2 = savePredictionRecord(sampleApp2, rejectedResult);

    const history = getPredictionHistory();
    expect(history).toHaveLength(2);
    expect(history[0].reference).toBe(record2.reference);
    expect(history[0].outcome).toBe("Rejected");
    expect(history[1].outcome).toBe("Approved");
  });

  it("clears prediction history completely", () => {
    savePredictionRecord(sampleApp1, approvedResult);
    expect(getPredictionHistory()).toHaveLength(1);

    clearPredictionHistory();
    expect(getPredictionHistory()).toHaveLength(0);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it("safely handles malformed JSON in localStorage", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, "{ broken json");
    _resetPredictionHistoryForTesting();

    const history = getPredictionHistory();
    expect(history).toEqual([]);
  });

  it("safely filters out corrupted records from localStorage", () => {
    const data = [
      { reference: "PRED-1", date: new Date().toISOString(), ...sampleApp1, outcome: "Approved" },
      { corrupted: true, randomField: 123 },
    ];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data));
    _resetPredictionHistoryForTesting();

    const history = getPredictionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].reference).toBe("PRED-1");
  });

  it("computes accurate summary statistics", () => {
    const summaryEmpty = computeHistorySummary([]);
    expect(summaryEmpty).toEqual({ total: 0, approved: 0, rejected: 0, approvalRate: 0 });

    const rec1 = {
      reference: "P1",
      date: new Date().toISOString(),
      ...sampleApp1,
      outcome: "Approved" as const,
    };
    const rec2 = {
      reference: "P2",
      date: new Date().toISOString(),
      ...sampleApp2,
      outcome: "Rejected" as const,
    };
    const rec3 = {
      reference: "P3",
      date: new Date().toISOString(),
      ...sampleApp1,
      outcome: "Approved" as const,
    };

    const summary = computeHistorySummary([rec1, rec2, rec3]);
    expect(summary.total).toBe(3);
    expect(summary.approved).toBe(2);
    expect(summary.rejected).toBe(1);
    expect(summary.approvalRate).toBeCloseTo(66.67, 1);
  });
});

describe("History page UI component", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  afterEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  it("renders empty state when no predictions have been made", () => {
    const HistoryComponent = HistoryRoute.options.component!;
    render(<HistoryComponent />);

    expect(screen.getByText("No predictions yet")).toBeInTheDocument();
    expect(screen.getByText("Submit a loan application to see it here.")).toBeInTheDocument();
    // Does not show demo data warning banner
    expect(screen.queryByText(/Demo data/i)).not.toBeInTheDocument();
  });

  it("renders saved predictions and handles search & outcome filter", () => {
    savePredictionRecord(sampleApp1, approvedResult);
    savePredictionRecord(sampleApp2, rejectedResult);

    const HistoryComponent = HistoryRoute.options.component!;
    render(<HistoryComponent />);

    // Does not show empty state
    expect(screen.queryByText("No predictions yet")).not.toBeInTheDocument();

    // Shows 2 rows
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();

    // Filter by Approved
    const filterSelect = screen.getByLabelText("Outcome");
    fireEvent.change(filterSelect, { target: { value: "Approved" } });

    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();

    // Filter by Rejected
    fireEvent.change(filterSelect, { target: { value: "Rejected" } });
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();

    // Reset filter
    fireEvent.change(filterSelect, { target: { value: "All" } });
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();

    // Search query with no match
    const searchInput = screen.getByLabelText("Search by reference");
    fireEvent.change(searchInput, { target: { value: "NONEXISTENT_REF" } });
    expect(screen.getByText("No matching records")).toBeInTheDocument();
  });
});

describe("Dashboard UI component", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  afterEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
  });

  it("renders 0 counts and empty states when no predictions exist", () => {
    const DashboardComponent = IndexRoute.options.component!;
    render(<DashboardComponent />);

    expect(screen.getByText("Total Predictions")).toBeInTheDocument();
    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("No recent predictions")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Submit a loan application on the Predict Loan page to see your results here.",
      ),
    ).toBeInTheDocument();
  });

  it("updates statistics and recent list when predictions are saved", () => {
    savePredictionRecord(sampleApp1, approvedResult);

    const DashboardComponent = IndexRoute.options.component!;
    render(<DashboardComponent />);

    expect(screen.getByText("1 saved prediction")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.queryByText("No recent predictions")).not.toBeInTheDocument();
  });
});

describe("Predict page and history integration", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
  });

  afterEach(() => {
    localStorage.clear();
    _resetPredictionHistoryForTesting();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("saves a record to history when prediction API call succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          prediction: "Approved",
          approval_probability: 0.95,
          message: "Loan outcome predicted as approved.",
        }),
      }),
    );

    const { Route: PredictRoute } = await import("@/routes/predict");
    const PredictComponent = PredictRoute.options.component!;
    render(<PredictComponent />);

    // Fill sample applicant
    const fillBtn = screen.getByRole("button", { name: /Fill Sample Applicant/i });
    fireEvent.click(fillBtn);

    // Click Predict Loan
    const predictBtn = screen.getByRole("button", { name: /Predict Loan/i });
    fireEvent.click(predictBtn);

    // Wait for result
    const savedMsg = await screen.findByText(/Saved to prediction history/i);
    expect(savedMsg).toBeInTheDocument();

    // Verify history service stored the record
    const history = getPredictionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].outcome).toBe("Approved");
    expect(history[0].cibil_score).toBe(782);
  });

  it("does not save to history when prediction API call fails", async () => {
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

    const { Route: PredictRoute } = await import("@/routes/predict");
    const PredictComponent = PredictRoute.options.component!;
    render(<PredictComponent />);

    // Fill sample applicant
    const fillBtn = screen.getByRole("button", { name: /Fill Sample Applicant/i });
    fireEvent.click(fillBtn);

    // Click Predict Loan
    const predictBtn = screen.getByRole("button", { name: /Predict Loan/i });
    fireEvent.click(predictBtn);

    // Wait for error card
    const errorTitle = await screen.findByText("Prediction Error");
    expect(errorTitle).toBeInTheDocument();

    // Confirm nothing was saved in history
    expect(getPredictionHistory()).toHaveLength(0);
    expect(screen.queryByText(/Saved to prediction history/i)).not.toBeInTheDocument();
  });
});
