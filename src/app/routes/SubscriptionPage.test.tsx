import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../shared/api/httpClient";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { walletApi } from "../../shared/api/walletApi";
import { NotificationProvider } from "../../shared/notifications/NotificationProvider";
import { SubscriptionPage } from "./SubscriptionPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/stepSixApi", () => ({
  stepSixApi: {
    plans: vi.fn(),
    subscription: vi.fn(),
    receipts: vi.fn(),
    purchase: vi.fn(),
  },
}));
vi.mock("../../shared/api/walletApi", () => ({
  walletApi: { balance: vi.fn() },
}));

const businessPlan = {
  id: 4,
  code: "BUSINESS_MONTHLY",
  name: "Biznes aylıq",
  billingPeriod: "MONTHLY" as const,
  amount: 10,
  currency: "AZN",
  scopeType: "BUSINESS" as const,
  coinPrice: 100,
  roomLimit: 5,
  employeeLimit: 500,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/app/businesses/9/subscription"]}>
        <NotificationProvider>
          <Routes><Route path="/app/businesses/:businessId/subscription" element={<SubscriptionPage scopeType="BUSINESS" />} /></Routes>
        </NotificationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SubscriptionPage", () => {
  beforeEach(() => {
    vi.mocked(stepSixApi.plans).mockResolvedValue([businessPlan]);
    vi.mocked(stepSixApi.subscription).mockRejectedValue(new ApiError(404, "Abunəlik tapılmadı.", null));
    vi.mocked(stepSixApi.receipts).mockResolvedValue([]);
    vi.mocked(walletApi.balance).mockResolvedValue({ userId: 7, balance: 140, updatedAt: "2026-08-30T12:00:00" });
    vi.mocked(stepSixApi.purchase).mockResolvedValue({
      paymentId: 11,
      walletTransactionId: 22,
      coinsSpent: 100,
      balanceAfter: 40,
      paymentReference: "COIN-SUB-22",
      subscription: {
        id: 5,
        scopeType: "BUSINESS",
        scopeId: 9,
        plan: businessPlan,
        billingPeriod: "MONTHLY",
        status: "ACTIVE",
        roomLimit: 5,
        employeeLimit: 500,
        startsAt: "2026-08-30T12:00:00",
        expiresAt: "2026-09-30T12:00:00",
        graceEndsAt: "2026-10-07T12:00:00",
        usageGraceEndsAt: null,
      },
      completedAt: "2026-08-30T12:00:00",
    });
  });

  it("shows the business coin plan, five-room limit, and completes a wallet purchase", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("140 coin")).toBeInTheDocument();
    expect(screen.getByText("100 coin")).toBeInTheDocument();
    expect(screen.getByText("5 otağa qədər")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /5-dən çox otaq lazımdır/i })).toHaveAttribute(
      "href",
      "https://wa.me/message/P63GI5XJ3PQLC1",
    );

    await user.click(screen.getByRole("button", { name: "100 coin ilə aktiv et" }));

    expect(await screen.findByText("Abunəlik aktivləşdirildi")).toBeInTheDocument();
    expect(screen.getByText("100 coin balansdan çıxıldı. Yeni balansınız 40 coindir.")).toBeInTheDocument();
    expect(stepSixApi.purchase).toHaveBeenCalledWith("BUSINESS", 9, "BUSINESS_MONTHLY", expect.any(String));
  });

  it("explains the shortfall and sends the user to balance top-up", async () => {
    vi.mocked(walletApi.balance).mockResolvedValueOnce({ userId: 7, balance: 25, updatedAt: "2026-08-30T12:00:00" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("75 coin çatmır");
    expect(screen.queryByRole("button", { name: "100 coin ilə aktiv et" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Balansı artır" })).toHaveLength(2);
  });
});
