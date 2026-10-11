import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Binary,
  BrainCircuit,
  Database,
  GitBranch,
  Gauge,
  Network,
  Sparkles,
  Target,
  TreePine,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { Fragment } from "react";
import { Card, CardTitle, PageHeader } from "@/components/common";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — Loan Approval Prediction System" },
      {
        name: "description",
        content:
          "Objective, workflow, algorithms and technologies behind the loan approval prediction mini-project.",
      },
      { property: "og:title", content: "About the Project" },
      {
        property: "og:description",
        content:
          "Objective, workflow, algorithms and technologies behind the loan approval prediction mini-project.",
      },
    ],
  }),
  component: AboutPage,
});

const TECH = [
  "Python",
  "Pandas",
  "NumPy",
  "Scikit-learn",
  "Matplotlib",
  "Joblib",
  "Flask",
  "React",
  "TypeScript",
  "Tailwind CSS",
];

const ALGOS = [
  {
    icon: Binary,
    name: "Logistic Regression",
    text: "Draws a boundary between approved and rejected cases by weighing each input, then turns the score into a probability.",
  },
  {
    icon: TreePine,
    name: "Decision Tree",
    text: "Asks a series of yes/no questions (e.g. “Is CIBIL above 550?”) to reach a decision, like a flowchart.",
  },
  {
    icon: Network,
    name: "Random Forest",
    text: "Builds many decision trees on different samples of data and takes a majority vote, which usually makes it more reliable.",
  },
];

const STEPS = [
  {
    icon: Database,
    name: "Dataset",
    text: "Collect historical loan applications with their outcomes.",
  },
  {
    icon: Wand2,
    name: "Data Preprocessing",
    text: "Clean values and encode categories into numbers.",
  },
  {
    icon: BrainCircuit,
    name: "Model Training",
    text: "Teach algorithms the patterns linked to approval.",
  },
  {
    icon: Gauge,
    name: "Model Evaluation",
    text: "Measure accuracy, precision, recall and F1 on test data.",
  },
  {
    icon: Sparkles,
    name: "Loan Prediction",
    text: "Use the trained model to predict new applications.",
  },
];

const FUTURE = [
  "Integrate the trained model through the Flask API",
  "Persistent prediction history via a backend database",
  "Additional evaluation visualizations",
  "Improved explainability of individual predictions",
  "Broader testing on unseen data",
  "Responsible ML practices for use in lending",
];

function AboutPage() {
  return (
    <>
      <PageHeader
        title="About the Project"
        subtitle="Loan Approval Prediction System Using Machine Learning — B.Tech CSE mini-project."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4 text-info" aria-hidden />
              Objective
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build a system that predicts whether a loan application is likely to be approved, using
            applicant, financial and asset details, and compare several machine learning algorithms.
          </p>
        </Card>
        <Card>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-info" aria-hidden />
              Problem statement
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manual loan screening is slow and inconsistent. This project produces a data-driven{" "}
            <strong className="text-foreground">prediction</strong> to assist review. It is not a
            replacement for a bank's credit assessment.
          </p>
        </Card>
      </div>

      <Card className="mt-4 min-w-0">
        <CardTitle>Technologies</CardTitle>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {TECH.map((t) => (
            <li
              key={t}
              className="rounded-lg border bg-muted/50 px-2.5 py-2 sm:px-3 sm:py-2.5 text-center text-xs sm:text-sm font-medium truncate"
            >
              {t}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4 min-w-0">
        <CardTitle>Algorithms</CardTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ALGOS.map(({ icon: Icon, name, text }) => (
            <div key={name} className="rounded-lg border p-4">
              <Icon className="h-5 w-5 text-info" aria-hidden />
              <h3 className="mt-2 font-medium">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 min-w-0">
        <CardTitle>Project workflow</CardTitle>
        <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-start">
          {STEPS.map(({ icon: Icon, name, text }, i) => (
            <Fragment key={name}>
              <li className="flex-1 rounded-lg border bg-card p-4 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="tabular flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0">
                    {i + 1}
                  </span>
                  <Icon className="h-4 w-4 text-info shrink-0" aria-hidden />
                </div>
                <h3 className="mt-2 text-sm font-medium">{name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{text}</p>
              </li>
              {i < STEPS.length - 1 && (
                <li
                  aria-hidden
                  className="flex justify-center text-muted-foreground lg:self-center"
                >
                  <ArrowDown className="h-4 w-4 lg:hidden" />
                  <ArrowRight className="hidden h-4 w-4 lg:block" />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </Card>

      <Card className="mt-4 min-w-0">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-info" aria-hidden />
            Future scope (planned)
          </span>
        </CardTitle>
        <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {FUTURE.map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden>•</span>
              {f}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
