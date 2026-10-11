import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Calculator,
  History,
  Info,
  Landmark,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackendStatus } from "@/components/common/BackendStatus";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predict", label: "Predict Loan", icon: Calculator },
  { to: "/performance", label: "Model Performance", icon: BarChart3 },
  { to: "/history", label: "Prediction History", icon: History },
  { to: "/about", label: "About Project", icon: Info },
] as const;

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          title={collapsed ? label : undefined}
          className="group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <span
            className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-sidebar-primary opacity-0 group-data-[status=active]:opacity-100"
            aria-hidden
          />
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && "sr-only")}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="rounded-md bg-sidebar-primary p-1.5 text-sidebar-primary-foreground">
        <Landmark className="h-5 w-5" aria-hidden />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-primary">LoanPredict ML</p>
          <p className="text-[11px] text-sidebar-foreground/70">Approval prediction</p>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  const title = current?.label ?? "Page not found";

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen w-full max-w-full lg:flex">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <div className="mt-auto p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 max-w-[calc(100vw-3rem)] flex-col bg-sidebar">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col w-full max-w-full">
        <header className="sticky top-0 z-40 flex h-14 w-full max-w-full items-center gap-2 sm:gap-3 border-b bg-card/95 px-3 sm:px-6 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-foreground truncate min-w-0 flex-1">{title}</p>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden text-xs text-muted-foreground xl:inline">
              Loan Approval Prediction System Using Machine Learning
            </span>
            <BackendStatus />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
