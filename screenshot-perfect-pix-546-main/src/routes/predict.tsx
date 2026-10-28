import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { AlertTriangle, FileText, Loader2, RotateCcw, Send, ServerOff } from "lucide-react";
import { Card, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { predictLoan } from "@/services/api";
import { savePredictionRecord } from "@/services/predictionHistory";
import type {
  ApiError,
  LoanApplication,
  LoanFieldKey,
  LoanFormErrors,
  LoanFormValues,
  PredictionRecord,
  PredictionResult,
} from "@/types/loan";
import {
  EMPTY_FORM,
  LOAN_TERM_UNIT,
  toApplication,
  validateField,
  validateForm,
} from "@/utils/validation";
import { formatINR } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Loan Approval — Loan Approval Prediction System" },
      {
        name: "description",
        content: "Enter applicant details to request a prediction from the machine learning model.",
      },
      { property: "og:title", content: "Predict Loan Approval" },
      {
        property: "og:description",
        content: "Enter applicant details to request a prediction from the machine learning model.",
      },
    ],
  }),
  component: PredictPage,
});

type FieldDef = {
  key: LoanFieldKey;
  label: string;
  helper: string;
  placeholder?: string;
  options?: string[];
  currency?: boolean;
};

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Applicant details",
    fields: [
      {
        key: "no_of_dependents",
        label: "Number of Dependents",
        helper: "Whole number from 0 to 5.",
        placeholder: "e.g. 2",
      },
      {
        key: "education",
        label: "Education",
        helper: "Highest education level.",
        options: ["Graduate", "Not Graduate"],
      },
      {
        key: "self_employed",
        label: "Self Employed",
        helper: "Is the applicant self-employed?",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    title: "Financial details",
    fields: [
      {
        key: "income_annum",
        label: "Annual Income (₹)",
        helper: "Yearly income in rupees.",
        placeholder: "e.g. 500000",
        currency: true,
      },
      {
        key: "loan_amount",
        label: "Loan Amount (₹)",
        helper: "Requested loan amount in rupees.",
        placeholder: "e.g. 1500000",
        currency: true,
      },
      {
        key: "loan_term",
        label: `Loan Term (${LOAN_TERM_UNIT})`,
        helper: `Repayment period in ${LOAN_TERM_UNIT}. Must be greater than 0.`,
        placeholder: "e.g. 12",
      },
      {
        key: "cibil_score",
        label: "CIBIL Score",
        helper: "Credit score from 300 to 900.",
        placeholder: "e.g. 750",
      },
    ],
  },
  {
    title: "Asset details",
    fields: [
      {
        key: "residential_assets_value",
        label: "Residential Assets Value (₹)",
        helper: "Value of residential property.",
        placeholder: "e.g. 1000000",
        currency: true,
      },
      {
        key: "commercial_assets_value",
        label: "Commercial Assets Value (₹)",
        helper: "Value of commercial property.",
        placeholder: "e.g. 200000",
        currency: true,
      },
      {
        key: "luxury_assets_value",
        label: "Luxury Assets Value (₹)",
        helper: "Vehicles, jewellery, etc.",
        placeholder: "e.g. 300000",
        currency: true,
      },
      {
        key: "bank_asset_value",
        label: "Bank Asset Value (₹)",
        helper: "Savings and deposits.",
        placeholder: "e.g. 250000",
        currency: true,
      },
    ],
  },
];

const inputCls =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const SAMPLE_APPLICANT: LoanFormValues = {
  no_of_dependents: "2",
  education: "Graduate",
  self_employed: "No",
  income_annum: "960000",
  loan_amount: "2900000",
  loan_term: "12",
  cibil_score: "782",
  residential_assets_value: "2400000",
  commercial_assets_value: "1760000",
  luxury_assets_value: "2270000",
  bank_asset_value: "800000",
};

function PredictPage() {
  const [values, setValues] = useState<LoanFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<LoanFormErrors>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    data: PredictionResult;
    submitted: LoanApplication;
    savedRecord?: PredictionRecord;
  } | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const lastApp = useRef<LoanApplication | null>(null);
  const inFlight = useRef(false);

  const update = (key: LoanFieldKey, v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key] !== undefined) setErrors((e) => ({ ...e, [key]: validateField(key, v) }));
  };
  const blur = (key: LoanFieldKey) =>
    setErrors((e) => ({ ...e, [key]: validateField(key, values[key]) }));

  const run = async (app: LoanApplication) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setApiError(null);
    setResult(null);
    try {
      const res = await predictLoan(app);
      if (res.ok) {
        const saved = savePredictionRecord(app, res.data);
        setResult({ data: res.data, submitted: app, savedRecord: saved });
      } else {
        setApiError(res.error);
      }
    } finally {
      setPending(false);
      inFlight.current = false;
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateForm(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(first)?.focus();
      return;
    }
    const app = toApplication(values);
    lastApp.current = app;
    void run(app);
  };

  const reset = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    setResult(null);
    setApiError(null);
    lastApp.current = null;
  };

  const fillSample = () => {
    setValues(SAMPLE_APPLICANT);
    setErrors({});
    setResult(null);
    setApiError(null);
    lastApp.current = null;
  };

  return (
    <>
      <PageHeader
        title="Predict Loan Approval"
        subtitle="Enter applicant details to request a prediction from the machine learning model."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 xl:col-span-2 min-w-0"
          aria-busy={pending}
        >
          {SECTIONS.map((s) => (
            <Card key={s.title}>
              <fieldset disabled={pending}>
                <legend className="mb-4 text-base font-semibold">{s.title}</legend>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s.fields.map((f) => {
                    const err = errors[f.key];
                    const helpId = `${f.key}-help`;
                    const errId = `${f.key}-error`;
                    const common = {
                      id: f.key,
                      name: f.key,
                      value: values[f.key],
                      "aria-invalid": !!err,
                      "aria-required": true,
                      "aria-describedby": err ? `${errId} ${helpId}` : helpId,
                      onBlur: () => blur(f.key),
                      className: cn(
                        inputCls,
                        err && "border-destructive focus-visible:ring-destructive",
                      ),
                    };
                    return (
                      <div key={f.key}>
                        <label htmlFor={f.key} className="mb-1.5 block text-sm font-medium">
                          {f.label}{" "}
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        </label>
                        {f.options ? (
                          <select {...common} onChange={(e) => update(f.key, e.target.value)}>
                            <option value="">Select…</option>
                            {f.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            {...common}
                            type="number"
                            inputMode="decimal"
                            placeholder={f.placeholder}
                            onChange={(e) => update(f.key, e.target.value)}
                          />
                        )}
                        <p id={helpId} className="mt-1 text-xs text-muted-foreground">
                          {f.helper}
                        </p>
                        <p
                          id={errId}
                          aria-live="polite"
                          className="mt-1 text-xs font-medium text-destructive"
                        >
                          {err && (
                            <>
                              <AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden />
                              {err}
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            </Card>
          ))}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {pending ? "Predicting…" : "Predict Loan"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={fillSample}
              disabled={pending}
            >
              <FileText className="h-4 w-4" aria-hidden /> Fill Sample Applicant
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={reset}
              disabled={pending}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset Form
            </Button>
          </div>
        </form>

        <div aria-live="polite" className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          {result && (
            <ResultPanel
              result={result.data}
              submitted={result.submitted}
              savedRecord={result.savedRecord}
              onAgain={reset}
            />
          )}
          {apiError && (
            <Card className="border-destructive/30 min-w-0 overflow-hidden">
              <div className="flex items-start gap-3">
                <ServerOff className="mt-0.5 h-6 w-6 shrink-0 text-destructive" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    {apiError.kind === "http_status" ? "Prediction Error" : "Backend not connected"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {apiError.kind === "http_status"
                      ? "The prediction service rejected the request or encountered an error."
                      : "The prediction service is currently unavailable. Please start the Flask backend and verify the API URL."}
                  </p>
                  <p className="mt-3 rounded-md bg-muted p-2 text-xs text-foreground break-words overflow-x-auto">
                    {apiError.message}
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    variant="outline"
                    onClick={() => lastApp.current && run(lastApp.current)}
                    disabled={pending}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Try Again
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {!result && !apiError && (
            <Card className="border-dashed text-sm text-muted-foreground">
              Fill in all fields and select{" "}
              <strong className="text-foreground">Predict Loan</strong>. The result from the model
              will appear here.
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function ResultPanel({
  result,
  submitted,
  savedRecord,
  onAgain,
}: {
  result: PredictionResult;
  submitted: LoanApplication;
  savedRecord?: PredictionRecord;
  onAgain: () => void;
}) {
  const rows: [string, string][] = [
    ["Dependents", String(submitted.no_of_dependents)],
    ["Education", submitted.education],
    ["Self employed", submitted.self_employed],
    ["Annual income", formatINR(submitted.income_annum)],
    ["Loan amount", formatINR(submitted.loan_amount)],
    ["Loan term", `${submitted.loan_term} ${LOAN_TERM_UNIT}`],
    ["CIBIL score", String(submitted.cibil_score)],
    ["Residential assets", formatINR(submitted.residential_assets_value)],
    ["Commercial assets", formatINR(submitted.commercial_assets_value)],
    ["Luxury assets", formatINR(submitted.luxury_assets_value)],
    ["Bank assets", formatINR(submitted.bank_asset_value)],
  ];
  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Model prediction</p>
        {savedRecord && (
          <span className="font-mono text-xs text-muted-foreground">{savedRecord.reference}</span>
        )}
      </div>
      <div className="mt-2">
        <StatusBadge outcome={result.prediction} size="lg" />
      </div>
      {savedRecord && <p className="mt-2 text-xs text-success">✓ Saved to prediction history</p>}
      {result.approval_probability !== undefined && (
        <p className="tabular mt-3 text-sm">
          Approval probability: <strong>{(result.approval_probability * 100).toFixed(1)}%</strong>
        </p>
      )}
      {result.message && <p className="mt-1 text-xs text-muted-foreground">{result.message}</p>}
      <dl className="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-2.5 border-t pt-4 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between min-[380px]:block">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <Button className="mt-4 w-full" onClick={onAgain}>
        Make Another Prediction
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        This prediction is for educational purposes and is not an official lending decision.
      </p>
    </Card>
  );
}
