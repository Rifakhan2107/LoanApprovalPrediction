import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileStack, Plus, Trophy, XCircle, type LucideIcon } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardTitle, DemoBadge, PageHeader } from "@/components/common";
import { RecordsTable } from "@/components/common/RecordsTable";
import { RecordDialog } from "@/components/common/RecordDialog";
import { AccuracyChart } from "@/components/performance/AccuracyChart";
import { Button } from "@/components/ui/button";
import { DEMO_RECORDS, DEMO_SUMMARY } from "@/data/demoData";
import { BEST_MODEL } from "@/data/metrics";
import { formatPercent } from "@/utils/format";
import type { DemoRecord } from "@/types/loan";

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
  demo,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  demo?: boolean;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="rounded-lg bg-info-soft p-2 text-info shrink-0">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {demo && <DemoBadge />}
      </div>
      <p className="mt-4 text-sm text-muted-foreground truncate">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
      {caption && <p className="mt-1 text-xs text-muted-foreground truncate">{caption}</p>}
    </Card>
  );
}

function Dashboard() {
  const [selected, setSelected] = useState<DemoRecord | null>(null);
  const pie = [
    { name: "Approved", value: DEMO_SUMMARY.approved, color: "var(--chart-1)" },
    { name: "Rejected", value: DEMO_SUMMARY.rejected, color: "var(--chart-2)" },
  ];
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
          label="Total Applications"
          value={String(DEMO_SUMMARY.total)}
          demo
          caption="Sample records"
        />
        <Stat
          icon={CheckCircle2}
          label="Approved Predictions"
          value={String(DEMO_SUMMARY.approved)}
          demo
          caption="Sample records"
        />
        <Stat
          icon={XCircle}
          label="Rejected Predictions"
          value={String(DEMO_SUMMARY.rejected)}
          demo
          caption="Sample records"
        />
        <Stat
          icon={Trophy}
          label="Best Model Accuracy"
          value={formatPercent(BEST_MODEL.accuracy)}
          caption={`${BEST_MODEL.model}, existing test run`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardTitle badge={<DemoBadge label="Demo visualization" />}>
            Approved vs. Rejected
          </CardTitle>
          <figure
            role="img"
            aria-label={`Donut chart of demo data: ${DEMO_SUMMARY.approved} approved and ${DEMO_SUMMARY.rejected} rejected`}
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
        </Card>
        <Card className="min-w-0 overflow-hidden lg:col-span-3">
          <CardTitle>Model accuracy comparison</CardTitle>
          <AccuracyChart />
        </Card>
      </div>

      <Card className="mt-4 min-w-0 overflow-hidden">
        <CardTitle badge={<DemoBadge />}>Recent predictions</CardTitle>
        <RecordsTable
          records={DEMO_RECORDS.slice(0, 5)}
          onView={setSelected}
          caption="Recent demo prediction records"
        />
      </Card>
      <RecordDialog record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
