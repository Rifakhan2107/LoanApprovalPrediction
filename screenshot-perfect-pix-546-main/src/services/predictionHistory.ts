import { useMemo, useSyncExternalStore } from "react";
import type {
  LoanApplication,
  LoanOutcome,
  PredictionRecord,
  PredictionResult,
} from "@/types/loan";

export const HISTORY_STORAGE_KEY = "loan_prediction_history";
export const HISTORY_CHANGE_EVENT = "loan_prediction_history_changed";

let memoryCache: PredictionRecord[] | null = null;
const EMPTY_LIST: PredictionRecord[] = [];

/**
 * Validates whether an unknown value conforms strictly to the PredictionRecord shape.
 * Protects against corrupted or tampered localStorage data.
 */
export function isValidRecord(item: unknown): item is PredictionRecord {
  if (!item || typeof item !== "object") return false;
  const r = item as Record<string, unknown>;

  const hasValidStrings =
    typeof r.reference === "string" &&
    r.reference.trim().length > 0 &&
    typeof r.date === "string" &&
    !Number.isNaN(Date.parse(r.date));

  const hasValidOutcome = r.outcome === "Approved" || r.outcome === "Rejected";

  const hasValidNumbers =
    typeof r.no_of_dependents === "number" &&
    !Number.isNaN(r.no_of_dependents) &&
    typeof r.income_annum === "number" &&
    !Number.isNaN(r.income_annum) &&
    typeof r.loan_amount === "number" &&
    !Number.isNaN(r.loan_amount) &&
    typeof r.loan_term === "number" &&
    !Number.isNaN(r.loan_term) &&
    typeof r.cibil_score === "number" &&
    !Number.isNaN(r.cibil_score) &&
    typeof r.residential_assets_value === "number" &&
    !Number.isNaN(r.residential_assets_value) &&
    typeof r.commercial_assets_value === "number" &&
    !Number.isNaN(r.commercial_assets_value) &&
    typeof r.luxury_assets_value === "number" &&
    !Number.isNaN(r.luxury_assets_value) &&
    typeof r.bank_asset_value === "number" &&
    !Number.isNaN(r.bank_asset_value);

  const hasValidCategoricals =
    (r.education === "Graduate" || r.education === "Not Graduate") &&
    (r.self_employed === "Yes" || r.self_employed === "No");

  const hasValidProbability =
    r.approval_probability === undefined ||
    (typeof r.approval_probability === "number" &&
      !Number.isNaN(r.approval_probability) &&
      r.approval_probability >= 0 &&
      r.approval_probability <= 1);

  return (
    hasValidStrings &&
    hasValidOutcome &&
    hasValidNumbers &&
    hasValidCategoricals &&
    hasValidProbability
  );
}

/**
 * Generates a collision-resistant reference: PRED-<timestamp>-<randomSuffix>
 */
export function generateReference(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRED-${timestamp}-${randomSuffix}`;
}

/**
 * Safely reads records from localStorage, drops invalid items, and sorts newest first.
 */
function readStorage(): PredictionRecord[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return EMPTY_LIST;
  }
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return EMPTY_LIST;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_LIST;

    const valid = parsed.filter(isValidRecord);
    // Sort descending by date (newest first)
    valid.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return valid;
  } catch {
    return EMPTY_LIST;
  }
}

/**
 * Safely writes records to localStorage.
 */
function writeStorage(records: PredictionRecord[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save prediction history to localStorage:", err);
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore subscriber error
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT));
  }
}

/**
 * Retrieves all saved prediction records (newest first).
 */
export function getPredictionHistory(): PredictionRecord[] {
  if (memoryCache === null) {
    memoryCache = readStorage();
  }
  return memoryCache;
}

/**
 * Saves a prediction application and backend result to localStorage.
 * Ensures only real outcomes ("Approved" | "Rejected") are stored.
 */
export function savePredictionRecord(
  application: LoanApplication,
  result: PredictionResult,
): PredictionRecord {
  const outcome: LoanOutcome = result.prediction === "Approved" ? "Approved" : "Rejected";

  const newRecord: PredictionRecord = {
    reference: generateReference(),
    date: new Date().toISOString(),
    no_of_dependents: application.no_of_dependents,
    education: application.education,
    self_employed: application.self_employed,
    income_annum: application.income_annum,
    loan_amount: application.loan_amount,
    loan_term: application.loan_term,
    cibil_score: application.cibil_score,
    residential_assets_value: application.residential_assets_value,
    commercial_assets_value: application.commercial_assets_value,
    luxury_assets_value: application.luxury_assets_value,
    bank_asset_value: application.bank_asset_value,
    outcome,
    approval_probability: result.approval_probability,
  };

  const current = getPredictionHistory();
  const updated = [newRecord, ...current];

  writeStorage(updated);
  memoryCache = updated;
  notifyListeners();

  return newRecord;
}

/**
 * Clears all prediction history from localStorage.
 */
export function clearPredictionHistory(): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryCache = [];
  notifyListeners();
}

export interface PredictionHistorySummary {
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number; // percentage 0-100
}

/**
 * Computes summary statistics from saved predictions.
 */
export function computeHistorySummary(records: PredictionRecord[]): PredictionHistorySummary {
  const total = records.length;
  let approved = 0;
  let rejected = 0;

  for (const r of records) {
    if (r.outcome === "Approved") approved++;
    else if (r.outcome === "Rejected") rejected++;
  }

  const approvalRate = total > 0 ? (approved / total) * 100 : 0;
  return { total, approved, rejected, approvalRate };
}

/**
 * Force reload from localStorage into memory cache.
 */
export function reloadPredictionHistory(): PredictionRecord[] {
  memoryCache = readStorage();
  notifyListeners();
  return memoryCache;
}

/**
 * Internal test helper to reset store state.
 */
export function _resetPredictionHistoryForTesting(): void {
  memoryCache = null;
  listeners.clear();
}

/**
 * Subscribes to store changes across components and browser tabs.
 */
export function subscribePredictionHistory(listener: Listener): () => void {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === HISTORY_STORAGE_KEY || event.key === null) {
      memoryCache = readStorage();
      listener();
    }
  };

  const handleCustom = () => {
    listener();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    window.addEventListener(HISTORY_CHANGE_EVENT, handleCustom);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleCustom);
    }
  };
}

/**
 * React hook to reactively access prediction history and calculated summary.
 */
export function usePredictionHistory() {
  const records = useSyncExternalStore(
    subscribePredictionHistory,
    getPredictionHistory,
    () => EMPTY_LIST,
  );

  const summary = useMemo(() => computeHistorySummary(records), [records]);

  return {
    records,
    summary,
    clearHistory: clearPredictionHistory,
    reloadHistory: reloadPredictionHistory,
  };
}
