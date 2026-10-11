import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Card, CardTitle, PageHeader } from "@/components/common";
import { AccuracyChart } from "@/components/performance/AccuracyChart";
import { ConfusionMatrix } from "@/components/performance/ConfusionMatrix";
import { BEST_MODEL, MODEL_METRICS, RANDOM_FOREST_CONFUSION_MATRIX } from "@/data/metrics";
import { formatMetric, formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Model Performance — Loan Approval Prediction System" },
      {
        name: "description",
        content:
          "Compare accuracy, precision, recall and F1 of Logistic Regression, Decision Tree and Random Forest.",
      },
      { property: "og:title", content: "Model Performance" },
      {
        property: "og:description",
        content:
          "Compare the classification performance of the trained machine learning algorithms.",
      },
    ],
  }),
  component: PerformancePage,
});

const EXPLAIN = [
  ["Accuracy", "Share of all predictions that were correct."],
  ["Precision", "Of the loans predicted as approved, how many were truly approved."],
  ["Recall", "Of the loans that were truly approved, how many the model found."],
  ["F1 score", "A single balance of precision and recall (their harmonic mean)."],
];

function PerformancePage() {
  return (
    <>
      <PageHeader
        title="Model Performance"
        subtitle="Compare the classification performance of the trained machine learning algorithms."
      />
      <Card className="min-w-0 overflow-hidden">
        <CardTitle>Evaluation metrics</CardTitle>
        <div className="w-full min-w-0 max-w-full overflow-hidden">
          <p className="text-[11px] text-muted-foreground sm:hidden mb-2">
            Scroll horizontally to view all metrics →
          </p>
          <div className="w-full max-w-full overflow-x-auto rounded-lg border overscroll-x-contain">
            <table className="w-full min-w-[500px] sm:min-w-[560px] text-sm">
              <caption className="sr-only">Model metrics from the existing test run</caption>
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Accuracy
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Precision
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Recall
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    F1
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MODEL_METRICS.map((m) => {
                  const best = m.model === BEST_MODEL.model;
                  return (
                    <tr key={m.model} className={cn(best ? "bg-success-soft/60" : "bg-card")}>
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        <span className="inline-flex items-center gap-2">
                          {m.model}
                          {best && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-card px-2 py-0.5 text-[11px] font-semibold text-success">
                              <Trophy className="h-3 w-3" aria-hidden /> Best
                            </span>
                          )}
                        </span>
                      </th>
                      <td className="tabular px-4 py-3 text-right">{formatPercent(m.accuracy)}</td>
                      <td className="tabular px-4 py-3 text-right">{formatMetric(m.precision)}</td>
                      <td className="tabular px-4 py-3 text-right">{formatMetric(m.recall)}</td>
                      <td className="tabular px-4 py-3 text-right">{formatMetric(m.f1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Results are from the existing test run and do not guarantee future performance.
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 overflow-hidden lg:col-span-3">
          <CardTitle>Accuracy comparison</CardTitle>
          <AccuracyChart />
        </Card>
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardTitle>What the metrics mean</CardTitle>
          <dl className="space-y-3 text-sm">
            {EXPLAIN.map(([k, v]) => (
              <div key={k}>
                <dt className="font-medium">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card className="mt-4 min-w-0 overflow-hidden">
        <CardTitle>Confusion Matrix (Random Forest Test-Set Results)</CardTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Confusion matrix counts evaluated on the held-out test set (854 total samples) for the
          selected best model, Random Forest Classifier.
        </p>
        <ConfusionMatrix
          tp={RANDOM_FOREST_CONFUSION_MATRIX.tp}
          tn={RANDOM_FOREST_CONFUSION_MATRIX.tn}
          fp={RANDOM_FOREST_CONFUSION_MATRIX.fp}
          fn={RANDOM_FOREST_CONFUSION_MATRIX.fn}
        />
      </Card>
    </>
  );
}
