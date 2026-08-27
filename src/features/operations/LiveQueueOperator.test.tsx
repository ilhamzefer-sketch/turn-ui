import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queueApi } from "../../shared/api/queueApi";
import { LiveQueueOperator } from "./LiveQueueOperator";

vi.mock("../../shared/api/queueApi", () => ({
  queueApi: {
    current: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    automatic: vi.fn(),
    reset: vi.fn(),
    callNext: vi.fn(),
    completeCurrent: vi.fn(),
    entryAction: vi.fn(),
    addManual: vi.fn(),
    updateManual: vi.fn(),
  },
}));

function renderOperator() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LiveQueueOperator roomId={30} />
    </QueryClientProvider>,
  );
}

describe("LiveQueueOperator", () => {
  beforeEach(() => {
    vi.mocked(queueApi.current).mockResolvedValue({
      id: 7,
      roomId: 30,
      roomName: "Canlı qəbul",
      serviceDate: "2026-08-27",
      status: "OPEN",
      acceptanceOverride: "AUTO",
      acceptingNewEntries: false,
      nextOpeningAt: "2026-08-28T09:00:00+04:00",
      nextResetAt: "2026-08-28T08:00:00",
      currentPublicReference: null,
      waitingCount: 0,
      skippedCount: 0,
      activeCount: 0,
      openedAt: "2026-08-27T08:00:00",
      closedAt: null,
      entries: [],
    });
  });

  it("shows schedule-driven state without asking for initial manual activation", async () => {
    renderOperator();

    expect(await screen.findByText("İş qrafikinə görə · 0 nəfər gözləyir")).toBeInTheDocument();
    expect(screen.getByText(/Növbəti açılış:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Canlı növbəni aç" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "İş qrafikinə qayıt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "İndi qəbul aç" })).toBeInTheDocument();
  });
});
