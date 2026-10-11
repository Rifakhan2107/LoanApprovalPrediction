import type { DemoRecord } from "@/types/loan";
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
  record: DemoRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {record.reference} <DemoBadge />
              </DialogTitle>
              <DialogDescription>
                Sample record for demonstration. Not a saved prediction.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-2">
              <StatusBadge outcome={record.outcome} />
            </div>
            <dl className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
              {[
                ["Date / time", formatDateTime(record.date)],
                ["Annual income", formatINR(record.income_annum)],
                ["Loan amount", formatINR(record.loan_amount)],
                ["Loan term", `${record.loan_term} ${LOAN_TERM_UNIT}`],
                ["CIBIL score", String(record.cibil_score)],
                ["Education", record.education],
                ["Self employed", record.self_employed],
                ["Dependents", String(record.no_of_dependents)],
              ].map(([k, v]) => (
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
