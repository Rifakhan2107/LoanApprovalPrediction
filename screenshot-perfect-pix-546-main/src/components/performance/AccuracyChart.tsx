import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MODEL_METRICS } from "@/data/metrics";

export function AccuracyChart() {
  return (
    <figure
      role="img"
      aria-label="Bar chart of test accuracy: Logistic Regression 92.39%, Decision Tree 97.54%, Random Forest 97.89%"
      className="w-full min-w-0 max-w-full overflow-hidden"
    >
      <div className="h-64 sm:h-72 w-full min-w-0 max-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MODEL_METRICS} margin={{ top: 8, right: 8, left: -10, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="model"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
            />
            <YAxis
              domain={[80, 100]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={35}
            />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(2)}%`, "Accuracy"]}
              contentStyle={{ borderRadius: 8, borderColor: "var(--border)" }}
            />
            <Legend verticalAlign="top" height={32} />
            <Bar
              dataKey="accuracy"
              name="Test accuracy (%)"
              fill="var(--chart-4)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">Y axis starts at 80% to make differences visible.</figcaption>
    </figure>
  );
}
