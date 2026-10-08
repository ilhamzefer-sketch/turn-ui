import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../shared/api/httpClient";
import { queueApi } from "../../shared/api/queueApi";
import { LiveQueueStatusPage } from "./LiveQueueStatusPage";
import { RoomLiveQueuePage } from "./RoomLiveQueuePage";

vi.mock("../../shared/api/queueApi", () => ({ queueApi: { publicRoom: vi.fn(), publicQr: vi.fn(), participant: vi.fn(), joinGuest: vi.fn(), joinGuestByQr: vi.fn(), joinAccount: vi.fn() } }));
vi.mock("../../shared/auth/useAuth", () => ({ useAuth: () => ({ status: "anonymous", user: null, restore: vi.fn() }) }));

const queue = { roomId: 7, roomName: "Qəbul otağı", sessionId: 1, status: "OPEN" as const, acceptingNewEntries: true, nextOpeningAt: null, nextResetAt: null, currentPublicReference: "Q-NOW", waitingCount: 2, approximateWaitingMinutes: 30, entries: [] };
const participant = { publicReference: "Q-123", status: "WAITING" as const, peopleAhead: 2, approximateWaitingMinutes: 30, currentPublicReference: "Q-NOW", acceptingNewEntries: true };

function renderPage(entry: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}><Routes>
    <Route path="/rooms/:roomId/live" element={<RoomLiveQueuePage />} />
    <Route path="/queue/:reference" element={<LiveQueueStatusPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
  return client;
}

describe("public queue recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queueApi.publicRoom).mockResolvedValue(queue);
    vi.mocked(queueApi.participant).mockResolvedValue(participant);
  });

  it.each(["bad", "0", "-1"])("rejects invalid room ID %s without remaining in loading", (id) => {
    renderPage(`/rooms/${id}/live`);
    expect(screen.getByRole("heading", { name: "Otaq keçidi düzgün deyil" })).toBeInTheDocument();
    expect(queueApi.publicRoom).not.toHaveBeenCalled();
  });

  it("allows retrying a failed live queue request", async () => {
    vi.mocked(queueApi.publicRoom).mockRejectedValueOnce(new ApiError(503, "Unavailable", null));
    renderPage("/rooms/7/live");
    expect(await screen.findByRole("heading", { name: "Canlı növbə yüklənmədi" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Yenidən yoxla" }));
    expect(await screen.findByRole("heading", { name: "Qəbul otağı" })).toBeInTheDocument();
  });

  it("keeps a queue visible while preventing joins after a polling failure", async () => {
    const client = renderPage("/rooms/7/live");
    await screen.findByRole("heading", { name: "Qəbul otağı" });
    vi.mocked(queueApi.publicRoom).mockRejectedValue(new ApiError(503, "Unavailable", null));
    await act(async () => { await client.refetchQueries({ queryKey: ["public-live-queue"] }); });
    expect(screen.getByRole("heading", { name: "Qəbul otağı" })).toBeInTheDocument();
    expect(await screen.findByText(/Növbənin son vəziyyəti yenilənmədi/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qonaq kimi növbəyə qoşul" })).toBeDisabled();
  });

  it("recovers a ticket request without claiming that its code is invalid", async () => {
    vi.mocked(queueApi.participant).mockRejectedValueOnce(new ApiError(500, "Server error", null));
    renderPage("/queue/Q-123");
    expect(await screen.findByRole("heading", { name: "Növbə statusu yüklənmədi" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Yenidən yoxla" }));
    expect(await screen.findByText("Q-123")).toBeInTheDocument();
  });

  it("keeps a previously loaded ticket on a polling failure", async () => {
    const client = renderPage("/queue/Q-123");
    await screen.findByText("Q-123");
    vi.mocked(queueApi.participant).mockRejectedValue(new ApiError(503, "Unavailable", null));
    await act(async () => { await client.refetchQueries({ queryKey: ["live-queue-participant"] }); });
    expect(screen.getByText("Q-123")).toBeInTheDocument();
    expect(await screen.findByText(/Növbə statusu yenilənmədi/)).toBeInTheDocument();
  });

  it("explains a genuinely missing ticket separately", async () => {
    vi.mocked(queueApi.participant).mockRejectedValue(new ApiError(404, "Missing", null));
    renderPage("/queue/Q-123");
    expect(await screen.findByRole("heading", { name: "Növbə tapılmadı" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yenidən yoxla" })).not.toBeInTheDocument();
  });
});
