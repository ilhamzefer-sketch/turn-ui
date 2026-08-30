import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { walletApi } from "../../shared/api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/walletApi", () => ({
  walletApi: {
    balance: vi.fn(),
    topUpOptions: vi.fn(),
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
  });

  it("shows balance, live conversion, disabled card payment, and a detailed WhatsApp request", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("125 coin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bank kartı ilə ödəniş et" })).toBeDisabled();
    expect(screen.getByText("Yaxın zamanda aktiv olacaq")).toBeInTheDocument();

    const amount = screen.getByRole("spinbutton", { name: "Coin miqdarı" });
    await user.clear(amount);
    await user.type(amount, "250");

    expect(screen.getByText(/^25[,.]00 ₼$/)).toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: "WhatsApp-da müraciət et" });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("https://wa.me/message/P63GI5XJ3PQLC1?text="));
    expect(decodeURIComponent(whatsapp.getAttribute("href") ?? "")).toContain("250 coin");
  });

  it("prevents a WhatsApp request when the amount exceeds the configured boundary", async () => {
    const user = userEvent.setup();
    renderPage();
    const amount = await screen.findByRole("spinbutton", { name: "Coin miqdarı" });

    await user.clear(amount);
    await user.type(amount, "1000001");

    expect(screen.getByRole("alert")).toHaveTextContent("Ən çox 1.000.000 coin seçə bilərsiniz.");
    expect(screen.getByText("WhatsApp-da müraciət et")).not.toHaveAttribute("href");
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
