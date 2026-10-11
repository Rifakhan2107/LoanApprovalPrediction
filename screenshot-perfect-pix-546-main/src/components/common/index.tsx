import { CheckCircle2, FlaskConical, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { LoanOutcome } from "@/types/loan";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between w-full min-w-0">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground break-normal whitespace-normal leading-tight sm:leading-snug">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground break-normal whitespace-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto shrink-0 min-w-0">{action}</div>}
    </div>
  );
}

export function StatusBadge({
  outcome,
  size = "sm",
}: {
  outcome: LoanOutcome;
  size?: "sm" | "lg";
}) {
  const approved = outcome === "Approved";
  const Icon = approved ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium shrink-0 whitespace-nowrap",
        approved
          ? "border-success/30 bg-success-soft text-success"
          : "border-destructive/30 bg-danger-soft text-destructive",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-4 py-2 text-lg",
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6"} aria-hidden />
      {outcome}
    </span>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning shrink-0 whitespace-nowrap">
      <FlaskConical className="h-3 w-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card p-4 sm:p-5 shadow-card w-full min-w-0 max-w-full overflow-hidden",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 min-w-0">
      <h2 className="text-base font-semibold text-foreground break-words min-w-0">{children}</h2>
      {badge}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { BackendStatus } from "./BackendStatus";
