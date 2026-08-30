import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Branch, ManagedRoom } from "../../shared/api/contracts";
import { ApiError } from "../../shared/api/httpClient";
import { managementApi } from "../../shared/api/managementApi";
import { NotificationProvider } from "../../shared/notifications/NotificationProvider";
import { BusinessRoomsPage } from "./BusinessRoomsPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/managementApi", () => ({
  managementApi: {
    branches: vi.fn(),
    businessRooms: vi.fn(),
    createBusinessRoom: vi.fn(),
  },
}));

const branch: Branch = {
  id: 2,
  businessId: 9,
  name: "Əsas filial",
  address: "Nizami 1",
  city: "Bakı",
  district: "Nəsimi",
  latitude: null,
  longitude: null,
  phone: null,
  notes: null,
  timezone: "Asia/Baku",
  effectivePhone: "+994501112233",
  status: "ACTIVE",
  createdAt: "2026-08-30T10:00:00",
  archivedAt: null,
};

function room(id: number): ManagedRoom {
  return {
    id,
    businessId: 9,
    branchId: branch.id,
    individualWorkspaceId: null,
    createdByUserId: 7,
    name: `Otaq ${id}`,
    roomNumberOrCode: null,
    description: null,
    notes: null,
    timezone: "Asia/Baku",
    reservationMode: "LIVE_QUEUE",
    defaultSlotDurationMinutes: 30,
    visibility: "UNLISTED",
    personalPublicAddress: null,
    personalLatitude: null,
    personalLongitude: null,
    appointmentBufferMinutes: 0,
    bookingWindowDays: 30,
    minimumAdvanceMinutes: 0,
    cancellationCutoffMinutes: 0,
    liveQueueResetPolicy: null,
    liveQueueResetLocalTime: null,
    liveQueueResetIntervalMinutes: null,
    liveQueueMaxParticipants: null,
    liveQueueAcceptingNewEntries: true,
    status: "PUBLISHED",
    createdAt: "2026-08-30T10:00:00",
    archivedAt: null,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/app/businesses/9/rooms"]}>
        <NotificationProvider>
          <Routes>
            <Route path="/app/businesses/:businessId/rooms" element={<BusinessRoomsPage />} />
          </Routes>
        </NotificationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BusinessRoomsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(managementApi.branches).mockResolvedValue([branch]);
    vi.mocked(managementApi.businessRooms).mockResolvedValue([1, 2, 3, 4, 5].map(room));
    vi.mocked(managementApi.createBusinessRoom).mockRejectedValue(
      new ApiError(409, "Biznes 5 otaq limitinə çatıb.", null),
    );
  });

  it("keeps the sixth-room form and offers WhatsApp when the server enforces the limit", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Otaq 5");
    await user.click(screen.getByRole("button", { name: "Yeni otaq" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filial" }), String(branch.id));
    await user.type(screen.getByRole("textbox", { name: "Otaq adı" }), "Altıncı otaq");
    await user.click(screen.getByRole("button", { name: "Davam et" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("5 otaq limitinə çatıb");
    expect(screen.getByRole("link", { name: /WhatsApp-da müraciət et/i })).toHaveAttribute(
      "href",
      "https://wa.me/message/P63GI5XJ3PQLC1",
    );
    expect(screen.getByRole("textbox", { name: "Otaq adı" })).toHaveValue("Altıncı otaq");
  });
});
