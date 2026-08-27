import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveQueueSession } from "../../shared/api/contracts";
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

const initialSession: LiveQueueSession = {
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
};

function renderOperator(refreshIntervalMs?: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LiveQueueOperator roomId={30} refreshIntervalMs={refreshIntervalMs} />
    </QueryClientProvider>,
  );
}

describe("LiveQueueOperator", () => {
  beforeEach(() => {
    vi.mocked(queueApi.current).mockReset().mockResolvedValue(initialSession);
  });

  it("shows schedule-driven state without asking for initial manual activation", async () => {
    renderOperator();

    expect(await screen.findByText("İş qrafikinə görə · 0 nəfər gözləyir")).toBeInTheDocument();
    expect(screen.getByText(/Növbəti açılış:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Canlı növbəni aç" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "İş qrafikinə qayıt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "İndi qəbul aç" })).toBeInTheDocument();
    expect(screen.getByText("Canlı siyahı avtomatik yenilənir")).toBeInTheDocument();
  });

  it("shows participants who join after the operator screen is opened", async () => {
    vi.mocked(queueApi.current)
      .mockResolvedValueOnce(initialSession)
      .mockResolvedValue({
        ...initialSession,
        waitingCount: 1,
        activeCount: 1,
        entries: [{
          id: 11,
          publicReference: "N-0011",
          queuePosition: 1,
          status: "WAITING",
          source: "WEB",
          displayName: "Yeni iştirakçı",
          phone: "+994504059961",
          linkedUserId: null,
          internalNote: null,
          createdByUserId: null,
          createdAt: "2026-08-27T11:00:00",
          completedAt: null,
          removedAt: null,
        }],
      });

    renderOperator(20);

    expect(await screen.findByText("İş qrafikinə görə · 0 nəfər gözləyir")).toBeInTheDocument();
    expect(await screen.findByText("Yeni iştirakçı")).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(queueApi.current).mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
