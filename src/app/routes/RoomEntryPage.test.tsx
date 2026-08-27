import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ManagedRoom, RoomStatus } from "../../shared/api/contracts";
import { managementApi } from "../../shared/api/managementApi";
import { RoomEntryPage } from "./RoomEntryPage";

vi.mock("../../shared/api/managementApi", () => ({
  managementApi: { room: vi.fn() },
}));

function CurrentLocation() {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}`}</p>;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/app/rooms/42"]}>
        <Routes>
          <Route path="/app/rooms/:roomId" element={<RoomEntryPage />} />
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function room(status: RoomStatus): ManagedRoom {
  return {
    id: 42,
    businessId: null,
    branchId: null,
    individualWorkspaceId: 11,
    createdByUserId: 7,
    name: "Fərdi qəbul",
    roomNumberOrCode: null,
    description: null,
    notes: null,
    timezone: "Asia/Baku",
    reservationMode: "PLANNED_BOOKING",
    defaultSlotDurationMinutes: 30,
    visibility: "UNLISTED",
    personalPublicAddress: null,
    personalLatitude: null,
    personalLongitude: null,
    appointmentBufferMinutes: 0,
    bookingWindowDays: 30,
    minimumAdvanceMinutes: 30,
    cancellationCutoffMinutes: 0,
    liveQueueResetPolicy: null,
    liveQueueResetLocalTime: null,
    liveQueueResetIntervalMinutes: null,
    liveQueueMaxParticipants: null,
    liveQueueAcceptingNewEntries: true,
    status,
    createdAt: "2026-08-27T08:00:00Z",
    archivedAt: null,
  };
}

describe("RoomEntryPage", () => {
  afterEach(() => vi.clearAllMocks());

  it("continues setup for a draft room", async () => {
    vi.mocked(managementApi.room).mockResolvedValue(room("DRAFT"));
    renderPage();
    await waitFor(() => expect(screen.getByText("/app/rooms/42/settings")).toBeInTheDocument());
  });

  it("opens today's work for a configured room", async () => {
    vi.mocked(managementApi.room).mockResolvedValue(room("PUBLISHED"));
    renderPage();
    await waitFor(() => expect(screen.getByText("/app/rooms/42/today")).toBeInTheDocument());
  });
});
