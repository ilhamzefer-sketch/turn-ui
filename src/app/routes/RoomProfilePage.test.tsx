import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicApi } from "../../shared/api/publicApi";
import { RoomProfilePage } from "./RoomProfilePage";

vi.mock("../../shared/api/publicApi", () => ({
  publicApi: {
    room: vi.fn(),
    availableSlots: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/rooms/7"]}>
        <Routes><Route path="/rooms/:roomId" element={<RoomProfilePage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RoomProfilePage", () => {
  beforeEach(() => {
    vi.mocked(publicApi.room).mockResolvedValue({
      id: 7,
      name: "Leyla ilə saç baxımı",
      roomNumberOrCode: "B-14",
      description: "Saç kəsimi və gündəlik baxım üçün planlı qəbul.",
      timezone: "Asia/Baku",
      reservationMode: "PLANNED_BOOKING",
      defaultSlotDurationMinutes: 30,
      appointmentBufferMinutes: 0,
      liveQueueAcceptingNewEntries: false,
      providerName: "Sahil Studio",
      providerDescription: "Səbaildə fərdi qulluq studiyası.",
      providerLogoUrl: null,
      branchName: "Mərkəz filialı",
      category: { id: 2, code: "BEAUTY", name: "Gözəllik" },
      customSubcategory: null,
      location: { address: "Nizami küçəsi 10", city: "Bakı", district: "Səbail", latitude: null, longitude: null },
      contactPhone: "+994501112233",
      owners: [{ displayName: "Leyla Məmmədova", phone: null }],
      averageRating: 4.8,
      ratingCount: 12,
    });
    vi.mocked(publicApi.availableSlots).mockResolvedValue([
      { startAt: "2026-08-18T10:00:00", endAt: "2026-08-18T10:30:00", timezone: "Asia/Baku" },
      { startAt: "2026-08-18T10:30:00", endAt: "2026-08-18T11:00:00", timezone: "Asia/Baku" },
    ]);
  });

  it("presents provider, branch, privacy, and available hours", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Leyla ilə saç baxımı" })).toBeInTheDocument();
    expect(screen.getAllByText("Mərkəz filialı")).toHaveLength(2);
    expect(screen.getByText("Telefon gizlidir")).toBeInTheDocument();
    expect(await screen.findByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("10:30")).toBeInTheDocument();
  });
});
