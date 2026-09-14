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
vi.mock("../../shared/api/walletApi", () => ({ walletApi: {
  balance: vi.fn(), topUpOptions: vi.fn(), activeTopUpRequest: vi.fn(), topUpRequest: vi.fn(),
  createTopUpRequest: vi.fn(), uploadReceipt: vi.fn(), transactions: vi.fn(),
} }));

const readyRequest: WalletTopUpRequest = {
  id: 9, packageCode: null, amountAzn: 7.3, coinAmount: 73, currency: "AZN",
  paymentUrl: "https://payment.example/pay/example", status: "AWAITING_RECEIPT", paymentProvider: "epoint",
  externalOrderId: "wallet-9-1", checkoutState: "READY", clickedAt: "2026-08-30T12:00:00",
  receiptDeadlineAt: "2026-08-30T12:30:00", receiptUploadedAt: null, receiptUploadOpen: false,
};

function renderPage(initialEntry = "/app/wallet") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[initialEntry]}><WalletPage /></MemoryRouter></QueryClientProvider>);
}

describe("WalletPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletApi.balance).mockResolvedValue({ userId: 7, balance: 125, updatedAt: "2026-08-30T12:00:00" });
    vi.mocked(walletApi.topUpOptions).mockResolvedValue({
      coinsPerAzn: 10, minimumCoins: 1, maximumCoins: 500, currency: "AZN", whatsappUrl: "https://wa.me/message/P63GI5XJ3PQLC1",
      bankCardEnabled: true, manualTopUpEnabled: false, customAmountEnabled: true, minimumAmountAzn: 0.1, maximumAmountAzn: 50, amountStepAzn: 0.1, packages: [],
    });
    vi.mocked(walletApi.transactions).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(walletApi.activeTopUpRequest).mockRejectedValue(new ApiError(404, "Aktiv sorğu yoxdur.", null));
    vi.mocked(walletApi.createTopUpRequest).mockResolvedValue(readyRequest);
    vi.mocked(walletApi.uploadReceipt).mockResolvedValue(readyRequest);
  });

  it("calculates coins for an entered amount and creates that exact amount", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Ödəniş məbləği");
    await user.type(input, "7,30");
    expect(screen.getByText("73 coin")).toBeInTheDocument();
    expect(screen.getByText("7,30 ₼ məbləği 73 coin edir.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "7,30 ₼ üçün ödəniş et" }));
    expect(walletApi.createTopUpRequest).toHaveBeenCalledWith(7.3, expect.anything());
  });

  it("shows a recoverable validation message for values below 10 qepik", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Ödəniş məbləği");
    await user.type(input, "0.09");
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Minimum məbləğ 0,10 ₼-dir.");
    expect(screen.getByRole("button", { name: "Ödəniş et" })).toBeDisabled();
    expect(input).toHaveValue("0.09");
  });

  it("rejects values above 50 azn", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Ödəniş məbləği");
    await user.type(input, "50.10");
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Maksimum məbləğ 50 ₼-dir.");
    expect(screen.getByRole("button", { name: "Ödəniş et" })).toBeDisabled();
  });

  it("keeps malformed punctuation out of the amount field", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Ödəniş məbləği");
    await user.type(input, ".0.0.0.");
    expect(input).toHaveValue("0.00");
  });

  it("does not render packages or provider branding in the purchase form", async () => {
    renderPage();
    await screen.findByText("125 coin");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText(/paket/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ödəniş et" })).toBeInTheDocument();
  });

  it("resumes an active checkout without offering receipt upload", async () => {
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
  });

  it("disables a new payment when custom amounts are unavailable", async () => {
    vi.mocked(walletApi.topUpOptions).mockResolvedValueOnce({
      coinsPerAzn: 10, minimumCoins: 1, maximumCoins: 500, currency: "AZN", whatsappUrl: "https://example.com",
      bankCardEnabled: false, manualTopUpEnabled: false, customAmountEnabled: false, minimumAmountAzn: 0.1, maximumAmountAzn: 50, amountStepAzn: 0.1, packages: [],
    });
    renderPage();
    expect(await screen.findByText("Ödəniş xidməti müvəqqəti əlçatan deyil.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ödəniş et" })).toBeDisabled();
  });
});
