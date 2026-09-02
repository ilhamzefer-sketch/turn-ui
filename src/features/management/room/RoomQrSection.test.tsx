import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ManagedRoom, QrCredential } from "../../../shared/api/contracts";
import { managementApi } from "../../../shared/api/managementApi";
import { RoomQrSection } from "./RoomQrSection";

vi.mock("../../../shared/api/managementApi", () => ({
  managementApi: {
    qrCodes: vi.fn(),
    createQrCode: vi.fn(),
    regenerateQrCode: vi.fn(),
    revokeQrCode: vi.fn(),
    updateQrPosterTitle: vi.fn(),
    downloadQrPoster: vi.fn(),
  },
}));

const room: ManagedRoom = {
  id: 42,
  businessId: null,
  branchId: null,
  individualWorkspaceId: 7,
  createdByUserId: 3,
  name: "Əsas qəbul",
  roomNumberOrCode: "A147",
  description: "Müştəri qəbulu",
  notes: null,
  timezone: "Asia/Baku",
  reservationMode: "LIVE_QUEUE",
  defaultSlotDurationMinutes: 15,
  visibility: "UNLISTED",
  personalPublicAddress: null,
  personalLatitude: null,
  personalLongitude: null,
  appointmentBufferMinutes: 0,
  bookingWindowDays: 30,
  minimumAdvanceMinutes: 0,
  cancellationCutoffMinutes: 0,
  liveQueueResetPolicy: "DAILY_AT_TIME",
  liveQueueResetLocalTime: "00:00:00",
  liveQueueResetIntervalMinutes: null,
  liveQueueMaxParticipants: 100,
  liveQueueAcceptingNewEntries: true,
  status: "PUBLISHED",
  createdAt: "2026-09-01T10:00:00",
  archivedAt: null,
};

const credential: QrCredential = {
  id: 91,
  roomId: room.id,
  type: "PERMANENT_ROOM",
  active: true,
  token: "poster-token",
  posterTitle: "Qapı ustası",
  createdAt: "2026-09-01T10:00:00",
  revokedAt: null,
};

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RoomQrSection room={room} />
    </QueryClientProvider>,
  );
}

describe("RoomQrSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(managementApi.qrCodes).mockResolvedValue([credential]);
    vi.mocked(managementApi.updateQrPosterTitle).mockResolvedValue(credential);
    vi.mocked(managementApi.downloadQrPoster).mockResolvedValue(undefined);
  });

  it("edits the per-QR poster title and shows it in the preview", async () => {
    const user = userEvent.setup();
    renderSection();

    const title = await screen.findByRole("textbox", { name: "Afişa başlığı" });
    await user.clear(title);
    await user.type(title, "Resepsiya girişi");

    expect(screen.getByRole("heading", { name: "Resepsiya girişi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF yüklə" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Başlığı yadda saxla" }));
    await waitFor(() => expect(managementApi.updateQrPosterTitle).toHaveBeenCalledWith(42, 91, "Resepsiya girişi"));
  });

  it("downloads an A4 PDF instead of an SVG", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole("button", { name: "PDF yüklə" }));
    await waitFor(() => expect(managementApi.downloadQrPoster).toHaveBeenCalledWith(42, 91, "qapı-ustası-qr-1.pdf"));
    expect(screen.queryByRole("button", { name: /SVG/i })).not.toBeInTheDocument();
  });
});
