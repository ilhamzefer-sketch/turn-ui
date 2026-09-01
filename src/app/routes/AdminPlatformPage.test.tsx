import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "../../shared/api/authApi";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { AdminPlatformPage } from "./AdminPlatformPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/authApi", () => ({ authApi: { logout: vi.fn() } }));
vi.mock("../../shared/api/stepSixApi", () => ({
  stepSixApi: {
    adminOverview: vi.fn(), adminUsers: vi.fn(), adminCreditCoins: vi.fn(), adminChangeUserPassword: vi.fn(),
    adminBusinesses: vi.fn(), adminIncreaseRoomLimit: vi.fn(), adminAccounts: vi.fn(), adminCreateAccount: vi.fn(),
    adminDisputes: vi.fn(), adminPhoneChanges: vi.fn(), adminDeletions: vi.fn(),
    adminTopUps: vi.fn(), adminTopUpReceipt: vi.fn(), approveTopUp: vi.fn(), rejectTopUp: vi.fn(),
    adminSupportRequests: vi.fn(), adminSupportAttachment: vi.fn(), reviewSupportRequest: vi.fn(),
    resolveDispute: vi.fn(), resolvePhoneChange: vi.fn(), resolveDeletion: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><AdminPlatformPage /></MemoryRouter></QueryClientProvider>);
}

describe("AdminPlatformPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    vi.mocked(stepSixApi.adminOverview).mockResolvedValue({ users: 1, activeUsers: 1, suspendedUsers: 0, businesses: 1, rooms: 3, activeSubscriptions: 1, graceSubscriptions: 0, suspendedSubscriptions: 0, completedSubscriptionPayments: 1, openOwnershipDisputes: 0, openPhoneChanges: 0, openDeletionRequests: 0 });
    vi.mocked(stepSixApi.adminUsers).mockResolvedValue({ items: [{ id: 7, firstName: "Aysel", lastName: "Məmmədova", phone: "+994501112233", status: "ACTIVE", coinBalance: 40, createdAt: "2026-08-30T10:00:00" }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    vi.mocked(stepSixApi.adminBusinesses).mockResolvedValue({ items: [{ id: 9, name: "NövbəTime Studio", status: "ACTIVE", ownerUserId: 7, ownerName: "Aysel Məmmədova", ownerPhone: "+994501112233", roomCount: 3, roomLimit: 5, subscriptionStatus: "ACTIVE" }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    vi.mocked(stepSixApi.adminAccounts).mockResolvedValue([{ id: 1, username: "admin", displayName: "Baş administrator", active: true, createdByUsername: null, createdAt: "2026-08-30T10:00:00" }]);
    vi.mocked(stepSixApi.adminDisputes).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminPhoneChanges).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminDeletions).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminTopUps).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(stepSixApi.adminSupportRequests).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(stepSixApi.adminCreditCoins).mockResolvedValue({ id: 12, type: "ADMIN_CREDIT", direction: "CREDIT", amount: 60, balanceBefore: 40, balanceAfter: 100, actorType: "ADMIN", referenceKey: "admin-credit", description: "Manual əlavə", createdAt: "2026-08-30T12:00:00" });
    vi.mocked(stepSixApi.adminChangeUserPassword).mockResolvedValue(undefined);
    vi.mocked(stepSixApi.adminIncreaseRoomLimit).mockResolvedValue({ id: 9, name: "NövbəTime Studio", status: "ACTIVE", ownerUserId: 7, ownerName: "Aysel Məmmədova", ownerPhone: "+994501112233", roomCount: 3, roomLimit: 8, subscriptionStatus: "ACTIVE" });
    vi.mocked(stepSixApi.adminCreateAccount).mockResolvedValue({ id: 2, username: "operations", displayName: "Əməliyyat admini", active: true, createdByUsername: "admin", createdAt: "2026-08-30T12:00:00" });
  });

  it("requires confirmation and credits the selected user", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole("heading", { name: "Platforma nəzarət mərkəzi" })).toBeInTheDocument();
    await screen.findByText("Aysel Məmmədova");
    expect(screen.getByText("40")).toBeInTheDocument();

    await user.type(screen.getByRole("spinbutton", { name: "Əlavə ediləcək coin" }), "60");
    await user.type(screen.getByRole("textbox", { name: "Əlavə səbəbi" }), "Manual əlavə");
    await user.click(screen.getByRole("button", { name: "Coin əlavə et" }));

    expect(screen.getByRole("alert")).toHaveTextContent("60 coin");
    await user.click(screen.getByRole("button", { name: "Əlavəni təsdiqlə" }));
    expect(await screen.findByText("Coin əlavə edildi. Yeni balans: 100 coin.")).toBeInTheDocument();
    expect(stepSixApi.adminCreditCoins).toHaveBeenCalledWith(7, 60, "Manual əlavə", expect.any(String));
  });

  it("increases a business limit and creates another admin", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("NövbəTime Studio");

    const limit = screen.getByRole("spinbutton", { name: "Yeni otaq limiti" });
    await user.clear(limit); await user.type(limit, "8");
    await user.type(screen.getByRole("textbox", { name: "Limit artımının səbəbi" }), "Əlavə otaq təsdiqi");
    await user.click(screen.getByRole("button", { name: "Otaq limitini artır" }));
    expect(await screen.findByText("Otaq limiti 8-ə qaldırıldı.")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Adminin adı" }), "Əməliyyat admini");
    await user.type(screen.getByRole("textbox", { name: "İstifadəçi adı" }), "operations");
    await user.type(screen.getByLabelText("Müvəqqəti şifrə"), "Operations-safe-2026");
    await user.type(screen.getByLabelText("Şifrəni təkrarla"), "Operations-safe-2026");
    await user.click(screen.getByRole("button", { name: "Admin hesabı yarat" }));
    expect(await screen.findByText("Yeni admin hesabı yaradıldı.")).toBeInTheDocument();
    expect(stepSixApi.adminCreateAccount).toHaveBeenCalledWith("operations", "Əməliyyat admini", "Operations-safe-2026");
  });

  it("changes a user password only after explicit confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    const userName = await screen.findByText("Aysel Məmmədova");
    const userCard = userName.closest("article");
    expect(userCard).not.toBeNull();
    const card = within(userCard as HTMLElement);

    await user.click(card.getByText("İstifadəçi şifrəsini dəyiş"));
    expect(card.getByText(/Köhnə şifrə göstərilmir/)).toBeInTheDocument();
    await user.type(card.getByLabelText("Yeni istifadəçi şifrəsi"), "Changed-safe-2026");
    await user.type(card.getByLabelText("Yeni şifrəni təkrarla"), "Changed-safe-2026");
    await user.type(card.getByLabelText("Şifrə dəyişikliyinin səbəbi"), "Təsdiqlənmiş müraciət");
    await user.click(card.getByRole("button", { name: "Şifrəni dəyiş" }));

    expect(card.getByRole("alert")).toHaveTextContent("bütün açıq sessiyalar bağlanacaq");
    await user.click(card.getByRole("button", { name: "Şifrə dəyişikliyini təsdiqlə" }));
    expect(await card.findByText("Şifrə dəyişdirildi və köhnə sessiyalar bağlandı.")).toBeInTheDocument();
    expect(stepSixApi.adminChangeUserPassword).toHaveBeenCalledWith(7, "Changed-safe-2026", "Təsdiqlənmiş müraciət");
  });
});
