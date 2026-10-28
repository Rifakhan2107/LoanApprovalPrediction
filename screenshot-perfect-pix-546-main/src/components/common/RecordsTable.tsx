import { Eye } from "lucide-react";
import type { DemoRecord, PredictionRecord } from "@/types/loan";
import { formatDateTime, formatINR } from "@/utils/format";
import { StatusBadge } from "./index";
import { Button } from "@/components/ui/button";

export function RecordsTable<
  T extends PredictionRecord | DemoRecord = PredictionRecord | DemoRecord,
>({ records, onView, caption }: { records: T[]; onView: (r: T) => void; caption: string }) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <p className="text-[11px] text-muted-foreground sm:hidden mb-2">
        Scroll horizontally to view all columns →
      </p>
      <div className="w-full max-w-full overflow-x-auto rounded-lg border overscroll-x-contain">
        <table className="w-full min-w-[620px] sm:min-w-[720px] text-xs sm:text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 font-medium">
                Reference
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 font-medium">
                Date / time
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 text-right font-medium">
                Applicant income
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 text-right font-medium">
                Loan amount
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 text-right font-medium">
                CIBIL
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 font-medium">
                Result
              </th>
              <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((r) => (
              <tr key={r.reference} className="bg-card hover:bg-muted/50">
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-mono text-xs">{r.reference}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-muted-foreground whitespace-nowrap">
                  {formatDateTime(r.date)}
                </td>
                <td className="tabular px-3 py-2.5 sm:px-4 sm:py-3 text-right whitespace-nowrap">
                  {formatINR(r.income_annum)}
                </td>
                <td className="tabular px-3 py-2.5 sm:px-4 sm:py-3 text-right whitespace-nowrap">
                  {formatINR(r.loan_amount)}
                </td>
                <td className="tabular px-3 py-2.5 sm:px-4 sm:py-3 text-right">{r.cibil_score}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <StatusBadge outcome={r.outcome} />
                </td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(r)}
                    aria-label={`View details for ${r.reference}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden /> View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
