import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { checkApiHealth } from "@/services/api";
import type { HealthResult } from "@/types/loan";

export function BackendStatus() {
  const [checking, setChecking] = useState(true);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyHealth = async () => {
    setChecking(true);
    setErrorMsg(null);
    try {
      const res = await checkApiHealth();
      if (res.ok) {
        setHealth(res.data);
        setErrorMsg(null);
      } else {
        setHealth(null);
        setErrorMsg(res.error.message);
      }
    } catch {
      setHealth(null);
      setErrorMsg("Failed to connect to backend");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void verifyHealth();
  }, []);

  if (checking) {
    return (
      <div
        role="status"
        aria-label="Checking backend status"
        className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-muted-foreground"
      >
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden />
        <span className="hidden sm:inline">Checking API…</span>
      </div>
    );
  }

  if (health) {
    const tooltip = health.model
      ? `${health.model}${health.accuracy ? ` (${(health.accuracy * 100).toFixed(1)}%)` : ""}`
      : (health.message ?? "Backend is running");

    return (
      <div
        role="status"
        title={tooltip}
        className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-success"
      >
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="font-medium whitespace-nowrap">API Online</span>
        {health.model && (
          <span className="hidden md:inline text-[11px] opacity-80">• {health.model}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={verifyHealth}
      title={errorMsg ? `${errorMsg} — Click to retry` : "Backend offline — Click to retry"}
      className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Backend offline. Click to retry connection check."
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
      </span>
      <span className="font-medium whitespace-nowrap">API Offline</span>
      <RefreshCw className="h-2.5 w-2.5" aria-hidden />
    </button>
  );
}
