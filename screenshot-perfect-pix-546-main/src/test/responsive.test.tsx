import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccuracyChart } from "@/components/performance/AccuracyChart";
import { ConfusionMatrix } from "@/components/performance/ConfusionMatrix";
import { RecordsTable } from "@/components/common/RecordsTable";
import { DEMO_RECORDS } from "@/data/demoData";
import { RANDOM_FOREST_CONFUSION_MATRIX } from "@/data/metrics";
import { Route as PredictRoute } from "@/routes/predict";
import { Route as HistoryRoute } from "@/routes/history";
import { Route as AboutRoute } from "@/routes/about";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useRouterState: vi.fn((opts) => {
      const state = { location: { pathname: "/" } };
      return opts?.select ? opts.select(state) : state;
    }),
    Link: ({
      children,
      to,
      className,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) => (
      <a href={to} className={className} {...props}>
        {children}
      </a>
    ),
  };
});

const TARGET_WIDTHS = [320, 375, 390, 412, 768, 1280];

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("Mobile and Desktop Screen Width Responsive Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:5000");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  describe.each(TARGET_WIDTHS)("Screen width: %ipx", (width) => {
    it(`renders AppLayout header and navigation correctly at ${width}px`, () => {
      setViewportWidth(width);
      render(
        <QueryClientProvider client={queryClient}>
          <AppLayout>
            <div data-testid="page-content">Content</div>
          </AppLayout>
        </QueryClientProvider>,
      );

      expect(screen.getByTestId("page-content")).toBeInTheDocument();

      const openButton = screen.queryByLabelText("Open menu");
      if (width < 1024) {
        expect(openButton).toBeInTheDocument();
        fireEvent.click(openButton!);
        expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
        const closeButton = screen.getByLabelText("Close menu");
        fireEvent.click(closeButton);
        expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
      }
    });

    it(`renders AccuracyChart and ConfusionMatrix at ${width}px`, () => {
      setViewportWidth(width);
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <div style={{ width: `${width}px` }}>
            <AccuracyChart />
            <ConfusionMatrix
              tp={RANDOM_FOREST_CONFUSION_MATRIX.tp}
              tn={RANDOM_FOREST_CONFUSION_MATRIX.tn}
              fp={RANDOM_FOREST_CONFUSION_MATRIX.fp}
              fn={RANDOM_FOREST_CONFUSION_MATRIX.fn}
            />
          </div>
        </QueryClientProvider>,
      );

      expect(screen.getByText("True Positive (TP)")).toBeInTheDocument();
      expect(screen.getByText("521")).toBeInTheDocument();
      expect(container.querySelector("figure")).toBeInTheDocument();
    });

    it(`renders RecordsTable with responsive scroll container at ${width}px`, () => {
      setViewportWidth(width);
      const onView = vi.fn();
      const { container } = render(
        <div style={{ width: `${width}px` }}>
          <RecordsTable records={DEMO_RECORDS.slice(0, 3)} onView={onView} caption="Test table" />
        </div>,
      );

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass("overscroll-x-contain");
    });

    it(`renders PredictPage form and responsive action buttons at ${width}px`, () => {
      setViewportWidth(width);
      const PredictComponent = PredictRoute.options.component!;
      render(
        <QueryClientProvider client={queryClient}>
          <div style={{ width: `${width}px` }}>
            <PredictComponent />
          </div>
        </QueryClientProvider>,
      );

      expect(screen.getByText("Predict Loan Approval")).toBeInTheDocument();
      const predictBtn = screen.getByRole("button", { name: /Predict Loan/i });
      expect(predictBtn).toBeInTheDocument();
      expect(predictBtn).toHaveClass("w-full");
      expect(predictBtn).toHaveClass("sm:w-auto");

      const fillBtn = screen.getByRole("button", { name: /Fill Sample Applicant/i });
      expect(fillBtn).toHaveClass("w-full");
      expect(fillBtn).toHaveClass("sm:w-auto");
    });

    it(`renders HistoryPage search and responsive filter select at ${width}px`, () => {
      setViewportWidth(width);
      const HistoryComponent = HistoryRoute.options.component!;
      render(
        <QueryClientProvider client={queryClient}>
          <div style={{ width: `${width}px` }}>
            <HistoryComponent />
          </div>
        </QueryClientProvider>,
      );

      expect(screen.getByText("Prediction History")).toBeInTheDocument();
      expect(screen.getByLabelText("Search by reference")).toBeInTheDocument();
      const filterSelect = screen.getByLabelText("Outcome");
      expect(filterSelect).toBeInTheDocument();
      expect(filterSelect).toHaveClass("w-full");
    });

    it(`renders AboutPage workflow and tech tags at ${width}px`, () => {
      setViewportWidth(width);
      const AboutComponent = AboutRoute.options.component!;
      render(
        <QueryClientProvider client={queryClient}>
          <div style={{ width: `${width}px` }}>
            <AboutComponent />
          </div>
        </QueryClientProvider>,
      );

      expect(screen.getByText("About the Project")).toBeInTheDocument();
      expect(screen.getByText("Objective")).toBeInTheDocument();
      expect(screen.getByText("Technologies")).toBeInTheDocument();
      expect(screen.getByText("Scikit-learn")).toBeInTheDocument();
    });
  });
});
