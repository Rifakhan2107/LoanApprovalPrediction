import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical, SearchX } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/common";
import { RecordsTable } from "@/components/common/RecordsTable";
import { RecordDialog } from "@/components/common/RecordDialog";
import { Button } from "@/components/ui/button";
import { DEMO_RECORDS } from "@/data/demoData";
import type { DemoRecord, LoanOutcome } from "@/types/loan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Prediction History — Loan Approval Prediction System" },
      {
        name: "description",
        content: "Browse sample loan prediction records with search, filters and pagination.",
      },
      { property: "og:title", content: "Prediction History" },
      {
        property: "og:description",
        content: "Browse sample loan prediction records with search, filters and pagination.",
      },
    ],
  }),
  component: HistoryPage,
});

const PAGE_SIZE = 10;

function HistoryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | LoanOutcome>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DemoRecord | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_RECORDS.filter(
        (r) =>
          (filter === "All" || r.outcome === filter) &&
          r.reference.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, filter],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const clear = () => {
    setQuery("");
    setFilter("All");
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Prediction History" subtitle="Review sample prediction records." />
      <div
        role="note"
        className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
      >
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong>Demo data.</strong> Persistent history requires future backend integration.
          Records below are samples and are not saved predictions.
        </p>
      </div>
      <Card className="min-w-0 overflow-hidden">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="mb-1.5 block text-sm font-medium">
              Search by reference
            </label>
            <input
              id="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. DEMO-1012"
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="filter" className="mb-1.5 block text-sm font-medium">
              Outcome
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as "All" | LoanOutcome);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">All</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        {rows.length ? (
          <>
            <RecordsTable records={rows} onView={setSelected} caption="Demo prediction history" />
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground" aria-live="polite">
                Showing {start + 1}–{start + rows.length} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular">
                  Page {current} of {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current >= pages}
                  onClick={() => setPage(current + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No matching records"
            description="Try a different reference or outcome filter."
            action={
              <Button variant="outline" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        )}
      </Card>
      <RecordDialog record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
