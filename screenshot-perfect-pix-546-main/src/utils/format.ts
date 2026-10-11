const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(n: number): string {
  return inr.format(n);
}

export function formatPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

export function formatMetric(n: number): string {
  return n.toFixed(3);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
