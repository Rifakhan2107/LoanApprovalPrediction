export interface ConfusionMatrixProps {
  tp?: number;
  tn?: number;
  fp?: number;
  fn?: number;
}

function Cell({
  label,
  abbr,
  value,
  desc,
}: {
  label: string;
  abbr: string;
  value?: number;
  desc: string;
}) {
  const has = typeof value === "number" && Number.isFinite(value);
  return (
    <div
      className={
        has ? "rounded-lg border bg-card p-4" : "rounded-lg border border-dashed bg-muted/60 p-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} ({abbr})
      </p>
      <p
        className={
          has
            ? "tabular mt-1 text-2xl font-semibold"
            : "mt-1 text-sm font-medium italic text-muted-foreground"
        }
      >
        {has ? value : "Not available"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

/** Pass real counts when available. Never fill with invented numbers. */
export function ConfusionMatrix({ tp, tn, fp, fn }: ConfusionMatrixProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Cell
        label="True Positive"
        abbr="TP"
        value={tp}
        desc="Approved loans correctly predicted as approved."
      />
      <Cell
        label="False Negative"
        abbr="FN"
        value={fn}
        desc="Approved loans wrongly predicted as rejected."
      />
      <Cell
        label="False Positive"
        abbr="FP"
        value={fp}
        desc="Rejected loans wrongly predicted as approved."
      />
      <Cell
        label="True Negative"
        abbr="TN"
        value={tn}
        desc="Rejected loans correctly predicted as rejected."
      />
    </div>
  );
}
