import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletTopUpRequest } from "../../shared/api/contracts";
import { ApiError } from "../../shared/api/httpClient";
import { walletApi } from "../../shared/api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/walletApi", () => ({
  walletApi: {
    balance: vi.fn(), topUpOptions: vi.fn(), activeTopUpRequest: vi.fn(), topUpRequest: vi.fn(),
    createTopUpRequest: vi.fn(), uploadReceipt: vi.fn(), transactions: vi.fn(),
  },
}));

const readyRequest: WalletTopUpRequest = {
  id: 9, packageCode: "AZN_10", amountAzn: 10, coinAmount: 100, currency: "AZN",
  paymentUrl: "https://epoint.az/pay/example", status: "AWAITING_RECEIPT", paymentProvider: "epoint",
  externalOrderId: "wallet-9-1", checkoutState: "READY", clickedAt: "2026-08-30T12:00:00",
  receiptDeadlineAt: "2026-08-30T12:30:00", receiptUploadedAt: null, receiptUploadOpen: false,
};

function renderPage(initialEntry = "/app/wallet") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}><WalletPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WalletPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletApi.balance).mockResolvedValue({ userId: 7, balance: 125, updatedAt: "2026-08-30T12:00:00" });
    vi.mocked(walletApi.topUpOptions).mockResolvedValue({
      coinsPerAzn: 10, minimumCoins: 1, maximumCoins: 1_000_000, currency: "AZN",
      whatsappUrl: "https://wa.me/message/P63GI5XJ3PQLC1", bankCardEnabled: true, manualTopUpEnabled: false,
      packages: [
        { code: "AZN_3", amountAzn: 3, coinAmount: 30 }, { code: "AZN_5", amountAzn: 5, coinAmount: 50 },
        { code: "AZN_10", amountAzn: 10, coinAmount: 100 }, { code: "AZN_15", amountAzn: 15, coinAmount: 150 },
        { code: "AZN_20", amountAzn: 20, coinAmount: 200 },
      ],
    });
    vi.mocked(walletApi.transactions).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(walletApi.activeTopUpRequest).mockRejectedValue(new ApiError(404, "Aktiv sorğu yoxdur.", null));
    vi.mocked(walletApi.createTopUpRequest).mockResolvedValue(readyRequest);
    vi.mocked(walletApi.uploadReceipt).mockResolvedValue(readyRequest);
  });

  it("exposes package selection as a labelled radio group", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("125 coin")).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(screen.getByRole("radiogroup", { name: "Coin paketi" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /100 coin/ })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("radio", { name: "5 ₼ · 50 coin" }));
    expect(screen.getByRole("radio", { name: "5 ₼ · 50 coin" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "10 ₼ · 100 coin" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "5 ₼ · 50 coin" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Epoint ilə ödəniş et 5 ₼" }));
    expect(walletApi.createTopUpRequest).toHaveBeenCalledWith("AZN_5", expect.anything());
  });

  it("resumes an active Epoint checkout without offering receipt upload", async () => {
    vi.mocked(walletApi.activeTopUpRequest).mockResolvedValueOnce(readyRequest);
    renderPage();
    expect(await screen.findByText("Ödəniş gözlənilir")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ödənişə davam et" })).toHaveAttribute("href", readyRequest.paymentUrl);
    expect(screen.queryByLabelText("Ödəniş çeki")).not.toBeInTheDocument();
  });

  it("does not announce success from the redirect before server confirmation", async () => {
    vi.mocked(walletApi.topUpRequest).mockResolvedValueOnce(readyRequest);
    renderPage("/app/wallet?payment=success&requestId=9");
    expect(await screen.findByText("Ödəniş emal olunur")).toBeInTheDocument();
    expect(screen.queryByText("Ödəniş təsdiqləndi")).not.toBeInTheDocument();
    expect(walletApi.topUpRequest).toHaveBeenCalledWith(9);
  });

  it("announces success only after the request is paid", async () => {
    vi.mocked(walletApi.topUpRequest).mockResolvedValueOnce({ ...readyRequest, paymentUrl: null, status: "PAID" });
    renderPage("/app/wallet?payment=success&requestId=9");
    expect(await screen.findByText("Ödəniş təsdiqləndi")).toBeInTheDocument();
    expect(screen.getByText("100 coin balansınıza əlavə edildi.")).toBeInTheDocument();
  });

  it("disables new payments when the server reports no supported method", async () => {
    vi.mocked(walletApi.topUpOptions).mockResolvedValueOnce({
      coinsPerAzn: 10, minimumCoins: 1, maximumCoins: 1_000_000, currency: "AZN", whatsappUrl: "https://example.com",
      bankCardEnabled: false, manualTopUpEnabled: false, packages: [{ code: "AZN_3", amountAzn: 3, coinAmount: 30 }],
    });
    renderPage();
    expect(await screen.findByText("Ödəniş xidməti müvəqqəti əlçatan deyil.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Epoint ilə ödəniş et/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /30 coin/ })).toBeDisabled();
  });

  it("restores receipt upload for an existing manual request", async () => {
    const manual: WalletTopUpRequest = {
      ...readyRequest, id: 12, packageCode: "AZN_3", amountAzn: 3, coinAmount: 30, paymentProvider: "manual",
      externalOrderId: null, checkoutState: "NOT_REQUIRED", paymentUrl: "https://bank.example/pay", receiptUploadOpen: true,
    };
    vi.mocked(walletApi.activeTopUpRequest).mockResolvedValueOnce(manual);
    vi.mocked(walletApi.uploadReceipt).mockResolvedValueOnce({
      ...manual, paymentUrl: null, receiptUploadOpen: false, receiptUploadedAt: "2026-08-30T12:05:00",
      status: "AUTO_CREDITED_PENDING_REVIEW",
    });
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Ödəniş çeki");
    const file = new File(["receipt"], "receipt.png", { type: "image/png" });
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Çeki göndər" }));
    expect(walletApi.uploadReceipt).toHaveBeenCalledWith(12, file);
  });

  it("renders an explicit empty transaction state", async () => {
    renderPage();
    expect(await screen.findByText("Hələ balans əməliyyatınız yoxdur.")).toBeInTheDocument();
  });
});
