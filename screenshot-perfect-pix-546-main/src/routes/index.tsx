import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  FileStack,
  Percent,
  PieChart as PieChartIcon,
  Plus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/common";
import { RecordsTable } from "@/components/common/RecordsTable";
import { RecordDialog } from "@/components/common/RecordDialog";
import { AccuracyChart } from "@/components/performance/AccuracyChart";
import { Button } from "@/components/ui/button";
import { usePredictionHistory } from "@/services/predictionHistory";
import type { PredictionRecord } from "@/types/loan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Loan Approval Prediction System" },
      {
        name: "description",
        content:
          "Analyze loan applications and explore machine learning-based approval predictions.",
      },
      { property: "og:title", content: "Loan Approval Prediction Dashboard" },
      {
        property: "og:description",
        content:
          "Analyze loan applications and explore machine learning-based approval predictions.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="rounded-lg bg-info-soft p-2 text-info shrink-0">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground truncate">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
      {caption && <p className="mt-1 text-xs text-muted-foreground truncate">{caption}</p>}
    </Card>
  );
}

function Dashboard() {
  const { records, summary } = usePredictionHistory();
  const [selected, setSelected] = useState<PredictionRecord | null>(null);

  const pie = [
    { name: "Approved", value: summary.approved, color: "var(--chart-1)" },
    { name: "Rejected", value: summary.rejected, color: "var(--chart-2)" },
  ];

  const recent = records.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Loan Approval Prediction Dashboard"
        subtitle="Analyze loan applications and explore machine learning-based approval predictions."
        action={
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto max-w-full justify-center px-4 sm:px-8 text-sm"
          >
            <Link to="/predict">
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span>Predict New Loan</span>
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full min-w-0">
        <Stat
          icon={FileStack}
          label="Total Predictions"
          value={String(summary.total)}
          caption={
            summary.total === 1 ? "1 saved prediction" : `${summary.total} saved predictions`
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Approved Predictions"
          value={String(summary.approved)}
          caption="Approved by model"
        />
        <Stat
          icon={XCircle}
          label="Rejected Predictions"
          value={String(summary.rejected)}
          caption="Rejected by model"
        />
        <Stat
          icon={Percent}
          label="Approval Rate"
          value={summary.total > 0 ? `${summary.approvalRate.toFixed(1)}%` : "0.0%"}
          caption={summary.total > 0 ? "From saved predictions" : "No predictions yet"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardTitle>Approved vs. Rejected (Live)</CardTitle>
          {summary.total > 0 ? (
            <figure
              role="img"
              aria-label={`Donut chart of saved predictions: ${summary.approved} approved and ${summary.rejected} rejected`}
            >
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {pie.map((p) => (
                        <Cell key={p.name} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </figure>
          ) : (
            <EmptyState
              icon={PieChartIcon}
              title="No prediction data"
              description="Make loan predictions to view approval vs. rejection distribution."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/predict">Predict Loan</Link>
                </Button>
              }
            />
          )}
        </Card>
        <Card className="min-w-0 overflow-hidden lg:col-span-3">
          <CardTitle>Model accuracy comparison (Test Set)</CardTitle>
          <AccuracyChart />
        </Card>
      </div>

      <Card className="mt-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent predictions</h2>
          {records.length > 5 && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">View all ({records.length})</Link>
            </Button>
          )}
        </div>
        {recent.length > 0 ? (
          <RecordsTable
            records={recent}
            onView={setSelected}
            caption="Recent live prediction records"
          />
        ) : (
          <EmptyState
            icon={FileStack}
            title="No recent predictions"
            description="Submit a loan application on the Predict Loan page to see your results here."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/predict">Predict Loan</Link>
              </Button>
            }
          />
        )}
      </Card>
      <RecordDialog record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
