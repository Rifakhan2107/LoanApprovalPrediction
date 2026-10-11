import type {
  HealthResponse,
  LoanApplication,
  PredictResponse,
  PredictionResult,
} from "@/types/loan";

export const REQUEST_TIMEOUT_MS = 15000;

export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw || !raw.trim()) return null;
  return raw.trim().replace(/\/+$/, "");
}

/** Builds a payload with exactly the 11 contract keys. */
export function buildPayload(a: LoanApplication): LoanApplication {
  return {
    no_of_dependents: a.no_of_dependents,
    education: a.education,
    self_employed: a.self_employed,
    income_annum: a.income_annum,
    loan_amount: a.loan_amount,
    loan_term: a.loan_term,
    cibil_score: a.cibil_score,
    residential_assets_value: a.residential_assets_value,
    commercial_assets_value: a.commercial_assets_value,
    luxury_assets_value: a.luxury_assets_value,
    bank_asset_value: a.bank_asset_value,
  };
}

export function parsePredictionBody(body: unknown): PredictionResult | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  if (typeof obj.prediction !== "string") return null;
  const p = obj.prediction.trim().toLowerCase();
  if (p !== "approved" && p !== "rejected") return null;
  const result: PredictionResult = { prediction: p === "approved" ? "Approved" : "Rejected" };
  const prob = obj.approval_probability;
  if (typeof prob === "number" && Number.isFinite(prob) && prob >= 0 && prob <= 1) {
    result.approval_probability = prob;
  }
  if (typeof obj.message === "string" && obj.message.trim()) result.message = obj.message.trim();
  return result;
}

export async function predictLoan(application: LoanApplication): Promise<PredictResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return {
      ok: false,
      error: {
        kind: "missing_base_url",
        message:
          "The API address is not configured. Set VITE_API_BASE_URL in your .env file and restart the dev server.",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(application)),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        ok: false,
        error: {
          kind: "timeout",
          message: "The prediction service did not respond within 15 seconds.",
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: "network",
        message:
          "Could not reach the prediction service. Check that Flask is running and CORS is enabled.",
      },
    };
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as Record<string, unknown> | null;
      if (errBody && typeof errBody === "object") {
        if (typeof errBody.error === "string" && errBody.error.trim()) {
          detail = errBody.error.trim();
        } else if (typeof errBody.message === "string" && errBody.message.trim()) {
          detail = errBody.message.trim();
        }
      }
    } catch {
      // Body is not JSON
    }

    return {
      ok: false,
      error: {
        kind: "http_status",
        message: detail || `The prediction service returned an error (status ${res.status}).`,
      },
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      error: {
        kind: "invalid_json",
        message: "The prediction service sent a response that is not valid JSON.",
      },
    };
  }

  const parsed = parsePredictionBody(body);
  if (!parsed) {
    return {
      ok: false,
      error: {
        kind: "invalid_shape",
        message:
          'The response did not contain a valid prediction (expected "Approved" or "Rejected").',
      },
    };
  }
  return { ok: true, data: parsed };
}

export async function checkApiHealth(): Promise<HealthResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return {
      ok: false,
      error: {
        kind: "missing_base_url",
        message:
          "The API address is not configured. Set VITE_API_BASE_URL in your .env file and restart the dev server.",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        ok: false,
        error: {
          kind: "timeout",
          message: "The prediction service did not respond within 15 seconds.",
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: "network",
        message:
          "Could not reach the prediction service. Check that Flask is running and CORS is enabled.",
      },
    };
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as Record<string, unknown> | null;
      if (errBody && typeof errBody === "object") {
        if (typeof errBody.error === "string" && errBody.error.trim()) {
          detail = errBody.error.trim();
        } else if (typeof errBody.message === "string" && errBody.message.trim()) {
          detail = errBody.message.trim();
        }
      }
    } catch {
      // Body is not JSON
    }

    return {
      ok: false,
      error: {
        kind: "http_status",
        message: detail || `The prediction service returned an error (status ${res.status}).`,
      },
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: true, data: { status: "ok" } };
  }

  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const status = typeof obj.status === "string" ? obj.status : "ok";
    const message = typeof obj.message === "string" ? obj.message : undefined;
    const model = typeof obj.model === "string" ? obj.model : undefined;
    const accuracy =
      typeof obj.accuracy === "number" && Number.isFinite(obj.accuracy) ? obj.accuracy : undefined;
    return {
      ok: true,
      data: {
        status,
        ...(message ? { message } : {}),
        ...(model ? { model } : {}),
        ...(accuracy !== undefined ? { accuracy } : {}),
      },
    };
  }

  return { ok: true, data: { status: "ok" } };
}
