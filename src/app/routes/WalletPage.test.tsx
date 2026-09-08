import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../shared/api/httpClient";
import { walletApi } from "../../shared/api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/walletApi", () => ({
  walletApi: {
    balance: vi.fn(),
    topUpOptions: vi.fn(),
    activeTopUpRequest: vi.fn(),
    createTopUpRequest: vi.fn(),
    uploadReceipt: vi.fn(),
    transactions: vi.fn(),
  },
}));

function renderPage(initialEntry = "/app/wallet") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}><WalletPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WalletPage", () => {
  beforeEach(() => {
    vi.mocked(walletApi.balance).mockResolvedValue({ userId: 7, balance: 125, updatedAt: "2026-08-30T12:00:00" });
    vi.mocked(walletApi.topUpOptions).mockResolvedValue({
      coinsPerAzn: 10,
      minimumCoins: 1,
      maximumCoins: 1_000_000,
      currency: "AZN",
      whatsappUrl: "https://wa.me/message/P63GI5XJ3PQLC1",
      bankCardEnabled: true,
    });
    vi.mocked(walletApi.transactions).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(walletApi.activeTopUpRequest).mockRejectedValue(new ApiError(404, "Aktiv sorğu yoxdur.", null));
    vi.mocked(walletApi.createTopUpRequest).mockResolvedValue({
      id: 9, packageCode: "AZN_10", amountAzn: 10, coinAmount: 100, currency: "AZN",
      paymentUrl: "https://epoint.az/pay/example", status: "AWAITING_RECEIPT",
      clickedAt: "2026-08-30T12:00:00", receiptDeadlineAt: "2026-08-30T12:30:00",
      receiptUploadedAt: null, receiptUploadOpen: true,
    });
  });

  it("shows package selection without the old payment contact panel", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("125 coin")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.queryByText("Cari sorğu")).not.toBeInTheDocument();
    expect(screen.queryByText("Bank kartı")).not.toBeInTheDocument();
    expect(screen.queryByText("WhatsApp ilə müraciət et")).not.toBeInTheDocument();

    await user.click(screen.getByText("50 coin").closest("button")!);
    expect(screen.getByText("Seçilən paket: 50 coin · 5 ₼")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Epoint ilə ödəniş et 5 ₼" }));
    expect(walletApi.createTopUpRequest).toHaveBeenCalledWith("AZN_5", expect.anything());
  });

  it("shows the active payment continuation state without receipt upload", async () => {
    vi.mocked(walletApi.activeTopUpRequest).mockResolvedValueOnce({
      id: 11, packageCode: "AZN_5", amountAzn: 5, coinAmount: 50, currency: "AZN",
      paymentUrl: "https://epoint.az/pay/active", status: "AWAITING_RECEIPT",
      clickedAt: "2026-08-30T12:00:00", receiptDeadlineAt: "2026-08-30T12:30:00",
      receiptUploadedAt: null, receiptUploadOpen: true,
    });
    renderPage();

    expect(await screen.findByText("Status: Ödəniş gözlənilir")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ödənişə davam et" })).toHaveAttribute("href", "https://epoint.az/pay/active");
    expect(screen.queryByText("Çeki göndər")).not.toBeInTheDocument();
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
  });

  it("renders payment return messages", async () => {
    const { unmount } = renderPage("/app/wallet?payment=success");
    expect(await screen.findByText("Ödənişiniz uğurludur. Coin balansınız yeniləndi.")).toBeInTheDocument();
    unmount();

    renderPage("/app/wallet?payment=failed");
    expect(await screen.findByRole("alert")).toHaveTextContent("Ödənişiniz uğursuzdur.");
  });

  it("renders an explicit empty transaction state", async () => {
    renderPage();

    expect(await screen.findByText("Hələ balans əməliyyatınız yoxdur.")).toBeInTheDocument();
  });

  it("shows a recoverable error when the wallet cannot be loaded", async () => {
    vi.mocked(walletApi.balance).mockRejectedValueOnce(new Error("Balans xidməti əlçatan deyil."));
    renderPage();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Balans açıla bilmədi");
    expect(error).toHaveTextContent("Balans xidməti əlçatan deyil.");
    expect(screen.getByRole("button", { name: "Yenidən yoxla" })).toBeInTheDocument();
  });
});
