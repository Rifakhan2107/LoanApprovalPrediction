import type { DemoRecord, PredictionRecord } from "@/types/loan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoBadge, StatusBadge } from "./index";
import { formatDateTime, formatINR } from "@/utils/format";
import { LOAN_TERM_UNIT } from "@/utils/validation";

export function RecordDialog({
  record,
  onClose,
}: {
  record: PredictionRecord | DemoRecord | null;
  onClose: () => void;
}) {
  const isDemo = record ? record.reference.startsWith("DEMO-") : false;

  const items: [string, string][] = record
    ? [
        ["Date / time", formatDateTime(record.date)],
        ["Annual income", formatINR(record.income_annum)],
        ["Loan amount", formatINR(record.loan_amount)],
        ["Loan term", `${record.loan_term} ${LOAN_TERM_UNIT}`],
        ["CIBIL score", String(record.cibil_score)],
        ["Education", record.education],
        ["Self employed", record.self_employed],
        ["Dependents", String(record.no_of_dependents)],
      ]
    : [];

  if (record && "residential_assets_value" in record) {
    const pr = record as PredictionRecord;
    items.push(
      ["Residential assets", formatINR(pr.residential_assets_value)],
      ["Commercial assets", formatINR(pr.commercial_assets_value)],
      ["Luxury assets", formatINR(pr.luxury_assets_value)],
      ["Bank assets", formatINR(pr.bank_asset_value)],
    );
  }

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {record.reference} {isDemo && <DemoBadge />}
              </DialogTitle>
              <DialogDescription>
                {isDemo
                  ? "Sample record for demonstration. Not a saved prediction."
                  : `Prediction saved on ${formatDateTime(record.date)}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="mb-2 flex items-center gap-3 flex-wrap">
              <StatusBadge outcome={record.outcome} />
              {record.approval_probability !== undefined && (
                <span className="text-xs text-muted-foreground tabular">
                  Approval probability:{" "}
                  <strong className="text-foreground">
                    {(record.approval_probability * 100).toFixed(1)}%
                  </strong>
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
              {items.map(([k, v]) => (
                <div key={k} className="flex justify-between min-[380px]:block">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tabular font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
