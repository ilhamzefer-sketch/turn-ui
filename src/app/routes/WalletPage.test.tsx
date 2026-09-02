import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { walletApi } from "../../shared/api/walletApi";
import { ApiError } from "../../shared/api/httpClient";
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><WalletPage /></MemoryRouter>
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
      bankCardEnabled: false,
    });
    vi.mocked(walletApi.transactions).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(walletApi.activeTopUpRequest).mockRejectedValue(new ApiError(404, "Aktiv sorğu yoxdur.", null));
    vi.mocked(walletApi.createTopUpRequest).mockResolvedValue({
      id: 9, packageCode: "AZN_10", amountAzn: 10, coinAmount: 100, currency: "AZN",
      paymentUrl: "https://cb.birbank.business/pay/example", status: "AWAITING_RECEIPT",
      clickedAt: "2026-08-30T12:00:00", receiptDeadlineAt: "2026-08-30T12:30:00",
      receiptUploadedAt: null, receiptUploadOpen: true,
    });
  });

  it("shows only the five fixed packages and creates the selected request", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("125 coin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bank kartı ilə ödəniş et" })).toBeDisabled();
    expect(screen.getByText("Yaxın zamanda aktiv olacaq")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ödə" })).toHaveLength(5);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Ödə" })[2]);
    expect(walletApi.createTopUpRequest).toHaveBeenCalledWith("AZN_10", expect.anything());
    expect(await screen.findByRole("link", { name: "Kapital ödəniş səhifəsini aç" })).toHaveAttribute("href", "https://cb.birbank.business/pay/example");
  });

  it("locks package buttons while an active receipt request exists", async () => {
    vi.mocked(walletApi.activeTopUpRequest).mockResolvedValueOnce({
      id: 11, packageCode: "AZN_5", amountAzn: 5, coinAmount: 50, currency: "AZN",
      paymentUrl: "https://cb.birbank.business/pay/active", status: "AUTO_CREDITED_PENDING_REVIEW",
      clickedAt: "2026-08-30T12:00:00", receiptDeadlineAt: "2026-08-30T12:30:00",
      receiptUploadedAt: "2026-08-30T12:10:00", receiptUploadOpen: false,
    });
    renderPage();
    expect(await screen.findByText("Status: Coin əlavə edildi, çek yoxlanılır")).toBeInTheDocument();
    expect(screen.getByText("Coin balansınıza əlavə edildi. Çek admin tərəfindən yoxlanılır.")).toBeInTheDocument();
    screen.getAllByRole("button", { name: "Ödə" }).forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByText("Çeki göndər")).not.toBeInTheDocument();
  });

  it("allows image and PDF receipt selection", async () => {
    vi.mocked(walletApi.activeTopUpRequest).mockResolvedValueOnce({
      id: 12, packageCode: "AZN_3", amountAzn: 3, coinAmount: 30, currency: "AZN",
      paymentUrl: "https://cb.birbank.business/pay/active", status: "AWAITING_RECEIPT",
      clickedAt: "2026-08-30T12:00:00", receiptDeadlineAt: "2026-08-30T12:30:00",
      receiptUploadedAt: null, receiptUploadOpen: true,
    });
    renderPage();

    const fileInput = await screen.findByLabelText("Fayl seçin");
    expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,application/pdf");
    expect(screen.getByText("JPG, PNG və ya PDF · maksimum 5 MB · 30 dəqiqə ərzində")).toBeInTheDocument();
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
