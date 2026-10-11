import type { ModelMetric } from "@/types/loan";

/** Real metrics from the existing test run. Do not alter. */
export const MODEL_METRICS: ModelMetric[] = [
  { model: "Logistic Regression", accuracy: 92.39, precision: 0.955, recall: 0.921, f1: 0.938 },
  { model: "Decision Tree", accuracy: 97.54, precision: 0.987, recall: 0.974, f1: 0.98 },
  { model: "Random Forest", accuracy: 97.89, precision: 0.985, recall: 0.981, f1: 0.983 },
];

export const BEST_MODEL = MODEL_METRICS.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));

/** Real confusion matrix metrics from the Random Forest test run (854 test samples). */
export const RANDOM_FOREST_CONFUSION_MATRIX = {
  tp: 521,
  tn: 315,
  fp: 8,
  fn: 10,
  total: 854,
};
