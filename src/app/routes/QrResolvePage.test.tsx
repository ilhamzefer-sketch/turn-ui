import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publicApi } from "../../shared/api/publicApi";
import { QrResolvePage } from "./QrResolvePage";

vi.mock("../../shared/api/publicApi", () => ({
  publicApi: { resolveQr: vi.fn() },
}));

function CurrentLocation() {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}`}</p>;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/q/qr-token"]}>
        <Routes>
          <Route path="/q/:token" element={<QrResolvePage />} />
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("QrResolvePage", () => {
  afterEach(() => vi.clearAllMocks());

  it("opens a live queue publicly and keeps the QR token", async () => {
    vi.mocked(publicApi.resolveQr).mockResolvedValue({
      roomId: 30,
      reservationMode: "LIVE_QUEUE",
      publicPath: "/rooms/30",
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("/rooms/30/live?qr=qr-token")).toBeInTheDocument());
  });

  it("opens the public room profile for a planned room", async () => {
    vi.mocked(publicApi.resolveQr).mockResolvedValue({
      roomId: 31,
      reservationMode: "PLANNED_BOOKING",
      publicPath: "/rooms/31",
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("/rooms/31")).toBeInTheDocument());
  });

  it("shows a recoverable error for an invalid QR token", async () => {
    vi.mocked(publicApi.resolveQr).mockRejectedValue(new Error("not found"));

    renderPage();

    expect(await screen.findByRole("heading", { name: "Bu QR kod aktiv deyil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Açıq otaqlara bax" })).toHaveAttribute("href", "/rooms");
  });
});
