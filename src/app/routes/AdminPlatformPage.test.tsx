import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminTopUpRequest } from "../../shared/api/contracts";

import { authApi } from "../../shared/api/authApi";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { AdminPlatformPage } from "./AdminPlatformPage";
import { AdminAccountsPage, AdminBusinessesPage, AdminPaymentsPage, AdminRequestsPage, AdminUsersPage } from "./AdminPlatformModules";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/authApi", () => ({ authApi: { logout: vi.fn() } }));
vi.mock("../../shared/api/stepSixApi", () => ({
  stepSixApi: {
    adminOverview: vi.fn(), adminUsers: vi.fn(), adminCreditCoins: vi.fn(), adminChangeUserPassword: vi.fn(),
    adminBusinesses: vi.fn(), adminIncreaseRoomLimit: vi.fn(), adminAccounts: vi.fn(), adminCreateAccount: vi.fn(),
    adminDisputes: vi.fn(), adminPhoneChanges: vi.fn(), adminDeletions: vi.fn(),
    adminTopUps: vi.fn(), adminTopUpReceipt: vi.fn(), approveTopUp: vi.fn(), rejectTopUp: vi.fn(), confirmTopUpFraud: vi.fn(),
    adminSupportRequests: vi.fn(), adminSupportAttachment: vi.fn(), reviewSupportRequest: vi.fn(),
    resolveDispute: vi.fn(), resolvePhoneChange: vi.fn(), resolveDeletion: vi.fn(),
  },
}));

function renderPage(page: ReactNode = <AdminPlatformPage />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><>{page}</></MemoryRouter></QueryClientProvider>);
}

const paymentSummary = {
  total: 24, paid: 10, failed: 4, waiting: 10, paidTodayAmount: 18,
  businessDate: "2026-08-30", timezone: "Asia/Baku",
};

describe("AdminPlatformPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    vi.mocked(stepSixApi.adminOverview).mockResolvedValue({ users: 1, activeUsers: 1, suspendedUsers: 0, businesses: 1, rooms: 3, activeSubscriptions: 1, graceSubscriptions: 0, suspendedSubscriptions: 0, completedSubscriptionPayments: 1, openOwnershipDisputes: 0, openPhoneChanges: 0, openDeletionRequests: 0 });
    vi.mocked(stepSixApi.adminUsers).mockResolvedValue({ items: [{ id: 7, firstName: "Aysel", lastName: "Məmmədova", phone: "+994501112233", status: "ACTIVE", coinBalance: 40, confirmedWalletFraudCount: 0, createdAt: "2026-08-30T10:00:00" }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    vi.mocked(stepSixApi.adminBusinesses).mockResolvedValue({ items: [{ id: 9, name: "NövbəTime Studio", status: "ACTIVE", ownerUserId: 7, ownerName: "Aysel Məmmədova", ownerPhone: "+994501112233", roomCount: 3, roomLimit: 5, subscriptionStatus: "ACTIVE" }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    vi.mocked(stepSixApi.adminAccounts).mockResolvedValue([{ id: 1, username: "admin", displayName: "Baş administrator", active: true, createdByUsername: null, createdAt: "2026-08-30T10:00:00" }]);
    vi.mocked(stepSixApi.adminDisputes).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminPhoneChanges).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminDeletions).mockResolvedValue([]);
    vi.mocked(stepSixApi.adminTopUps).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false, summary: paymentSummary });
    vi.mocked(stepSixApi.confirmTopUpFraud).mockResolvedValue({ id: 15, userId: 7, firstName: "Aysel", lastName: "Məmmədova", phone: "+994501112233", packageCode: "AZN_3", amountAzn: 3, coinAmount: 30, currency: "AZN", paymentProvider: "manual", externalOrderId: null, status: "FRAUD_CONFIRMED", clickedAt: "2026-08-30T10:00:00", receiptDeadlineAt: "2026-08-30T10:30:00", receiptUploadedAt: "2026-08-30T10:05:00", receiptAttachmentId: 4, receiptMediaType: "image/png", receiptSizeBytes: 1200, confirmedFraudCount: 1, fraudCountAfter: 1, reviewedAt: "2026-08-30T10:10:00", resolutionNote: "Ödəniş daxil olmayıb" });
    vi.mocked(stepSixApi.adminSupportRequests).mockResolvedValue({ items: [], page: 0, size: 20, hasNext: false });
    vi.mocked(stepSixApi.adminCreditCoins).mockResolvedValue({ id: 12, type: "ADMIN_CREDIT", direction: "CREDIT", amount: 60, balanceBefore: 40, balanceAfter: 100, actorType: "ADMIN", referenceKey: "admin-credit", description: "Manual əlavə", createdAt: "2026-08-30T12:00:00" });
    vi.mocked(stepSixApi.adminChangeUserPassword).mockResolvedValue(undefined);
    vi.mocked(stepSixApi.adminIncreaseRoomLimit).mockResolvedValue({ id: 9, name: "NövbəTime Studio", status: "ACTIVE", ownerUserId: 7, ownerName: "Aysel Məmmədova", ownerPhone: "+994501112233", roomCount: 3, roomLimit: 8, subscriptionStatus: "ACTIVE" });
    vi.mocked(stepSixApi.adminCreateAccount).mockResolvedValue({ id: 2, username: "operations", displayName: "Əməliyyat admini", active: true, createdByUsername: "admin", createdAt: "2026-08-30T12:00:00" });
  });

  it("shows a compact overview with links to each admin module", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Ümumi vəziyyət" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /İstifadəçilər/ })).toHaveAttribute("href", "/platform/users");
    expect(screen.getByRole("link", { name: /Bizneslər/ })).toHaveAttribute("href", "/platform/businesses");
    expect(screen.getByRole("link", { name: /Ödənişlər/ })).toHaveAttribute("href", "/platform/payments");
  });

  it("shows registration dates in the user list and preserves the server's newest-first order", async () => {
    const page = await stepSixApi.adminUsers();
    const olderUser = page.items[0];
    vi.mocked(stepSixApi.adminUsers).mockResolvedValue({ ...page, totalElements: 2, items: [
      { ...olderUser, id: 8, firstName: "Leyla", createdAt: "2026-09-24T10:00:00" },
      olderUser,
    ] });
    renderPage(<AdminUsersPage />);
    const newest = await screen.findByRole("button", { name: /Leyla Məmmədova/ });
    const list = newest.parentElement!;
    const rows = within(list).getAllByRole("button");
    expect(rows[0]).toBe(newest);
    expect(rows[1]).toHaveTextContent("Aysel Məmmədova");
    expect(newest).toHaveTextContent("Qeydiyyat tarixi:");
    expect(newest.querySelector("time")).toHaveAttribute("datetime", "2026-09-24T10:00:00");
    expect(newest.querySelector("time")).toHaveTextContent("24.09.2026");
    expect(screen.getByText("Ən yeni qeydiyyatdan keçənlər əvvəl göstərilir.")).toBeInTheDocument();
  });

  it("reuses the coin operation key after a lost response and rotates it after success", async () => {
    const user = userEvent.setup();
    vi.mocked(stepSixApi.adminCreditCoins).mockRejectedValueOnce(new Error("Cavab alınmadı"));
    renderPage(<AdminUsersPage />);
    await user.click(await screen.findByRole("button", { name: /Aysel Məmmədova/ }));
    const submit = async () => {
      await user.type(screen.getByRole("spinbutton", { name: "Əlavə ediləcək coin" }), "60");
      await user.type(screen.getByRole("textbox", { name: "Əlavə səbəbi" }), "Manual əlavə");
      await user.click(screen.getByRole("button", { name: "Coin əlavə et" }));
      await user.click(screen.getByRole("button", { name: "Əlavəni təsdiqlə" }));
    };
    await submit();
    await screen.findByText("Cavab alınmadı");
    await user.click(screen.getByRole("button", { name: "Əlavəni təsdiqlə" }));
    await screen.findByText(/Coin əlavə edildi/);
    const calls = vi.mocked(stepSixApi.adminCreditCoins).mock.calls;
    expect(calls[1]).toEqual(calls[0]);
    await submit();
    expect(calls[2][3]).not.toBe(calls[0][3]);
  });

  it("paginates requests and shows closed status and previous response without edit controls", async () => {
    const user = userEvent.setup();
    const item = { id: 1, userId: 7, firstName: "Aysel", lastName: "Məmmədova", phone: "+994501112233", requestType: "PROBLEM" as const, message: "Problem həll olundu", status: "RESOLVED" as const, attachmentId: null, attachmentMediaType: null, attachmentSizeBytes: null, attachmentFilename: null, adminResponse: "Əvvəlki cavab", reviewedByAdmin: "admin", createdAt: "2026-09-20T10:00:00", updatedAt: "2026-09-24T10:00:00", reviewedAt: "2026-09-24T10:00:00" };
    vi.mocked(stepSixApi.adminSupportRequests).mockImplementation(async (_type, _status, page = 0) => ({ items: [{ ...item, id: page + 1, message: page === 0 ? "Birinci səhifə" : "İkinci səhifə" }], page, size: 20, hasNext: page === 0 }));
    renderPage(<AdminRequestsPage />);
    await screen.findByText("Birinci səhifə");
    expect(screen.getByText(/Cari status:/).parentElement).toHaveTextContent("Həll edildi");
    expect(screen.getByText(/Əvvəlki admin cavabı:/).parentElement).toHaveTextContent("Əvvəlki cavab");
    expect(screen.queryByRole("button", { name: "Yenilə" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Əvvəlki səhifə" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Növbəti səhifə" }));
    await screen.findByText("İkinci səhifə");
    expect(stepSixApi.adminSupportRequests).toHaveBeenLastCalledWith("", "", 1);
    expect(screen.getByRole("button", { name: "Növbəti səhifə" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Əvvəlki səhifə" }));
    await screen.findByText("Birinci səhifə");
  });

  it("requires confirmation and credits the selected user", async () => {
    const user = userEvent.setup();
    renderPage(<AdminUsersPage />);
    expect((await screen.findAllByRole("heading", { name: "İstifadəçilər" })).length).toBeGreaterThanOrEqual(1);
    await user.click(await screen.findByRole("button", { name: /Aysel Məmmədova/ }));
    expect(await screen.findByRole("heading", { name: "İstifadəçi məlumatları" })).toBeInTheDocument();
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
    const view = renderPage(<AdminBusinessesPage />);
    await screen.findByText("NövbəTime Studio");

    const limit = screen.getByRole("spinbutton", { name: "Yeni otaq limiti" });
    await user.clear(limit); await user.type(limit, "8");
    await user.type(screen.getByRole("textbox", { name: "Limit artımının səbəbi" }), "Əlavə otaq təsdiqi");
    await user.click(screen.getByRole("button", { name: "Otaq limitini artır" }));
    expect(await screen.findByText("Otaq limiti 8-ə qaldırıldı.")).toBeInTheDocument();

    view.unmount();
    renderPage(<AdminAccountsPage />);
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
    renderPage(<AdminUsersPage />);
    await user.click(await screen.findByRole("button", { name: /Aysel Məmmədova/ }));
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

  it("shows server summaries, grouped filters and payment pagination", async () => {
    vi.mocked(stepSixApi.adminTopUps).mockResolvedValueOnce({
      items: [{
        id: 15, userId: 7, firstName: "Aysel", lastName: "Mammadova", phone: "+994501112233",
        packageCode: "AZN_3", amountAzn: 3, coinAmount: 30, currency: "AZN", paymentProvider: "epoint", externalOrderId: "wallet-15-1",
        status: "PAID", clickedAt: "2026-08-30T10:00:00",
        receiptDeadlineAt: "2026-08-30T10:30:00", receiptUploadedAt: "2026-08-30T10:05:00",
        receiptAttachmentId: 4, receiptMediaType: "image/png", receiptSizeBytes: 1200,
        confirmedFraudCount: 0, fraudCountAfter: null, reviewedAt: null, resolutionNote: null,
      }],
      page: 0, size: 20, hasNext: true, summary: paymentSummary,
    });
    const user = userEvent.setup();
    renderPage(<AdminPaymentsPage />);

    const paymentHeading = await screen.findByText(/Aysel Mammadova/);
    expect(paymentHeading).toBeInTheDocument();
    const paymentCard = paymentHeading.closest("article");
    expect(paymentCard).not.toBeNull();
    expect(paymentCard).toHaveTextContent("Ödəniş tamamlandı");
    expect(screen.getByRole("button", { name: "Hamısı" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Ödənilib" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bağlanıb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gözləyir" })).toBeInTheDocument();
    expect(screen.getByText("18,00 ₼")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Növbəti səhifə" })).toBeEnabled();
    expect(stepSixApi.confirmTopUpFraud).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Növbəti səhifə" }));
    expect(stepSixApi.adminTopUps).toHaveBeenLastCalledWith("", 1);
    await user.click(screen.getByRole("button", { name: "Bağlanıb" }));
    expect(stepSixApi.adminTopUps).toHaveBeenLastCalledWith("FAILED_GROUP", 0);
  });

  it("requires a reason and confirmation before rejecting a legacy receipt", async () => {
    const request: AdminTopUpRequest = {
      id: 21, userId: 7, firstName: "Aysel", lastName: "Məmmədova", phone: "+994501112233",
      packageCode: "AZN_5", amountAzn: 5, coinAmount: 50, currency: "AZN",
      paymentProvider: "manual", externalOrderId: null, status: "MANUAL_REVIEW",
      clickedAt: "2026-08-30T10:00:00", receiptDeadlineAt: "2026-08-30T10:30:00",
      receiptUploadedAt: "2026-08-30T10:05:00", receiptAttachmentId: 4,
      receiptMediaType: "image/png", receiptSizeBytes: 1200, confirmedFraudCount: 3,
      fraudCountAfter: null, reviewedAt: null, resolutionNote: null,
    };
    vi.mocked(stepSixApi.adminTopUps).mockResolvedValueOnce({
      items: [request], page: 0, size: 20, hasNext: false, summary: paymentSummary,
    });
    vi.mocked(stepSixApi.rejectTopUp).mockResolvedValue({ ...request, status: "REJECTED" });
    const user = userEvent.setup();
    renderPage(<AdminPaymentsPage />);
    const card = (await screen.findByText("Aysel Məmmədova")).closest("article");
    expect(card).not.toBeNull();
    const controls = within(card as HTMLElement);

    await user.click(controls.getByRole("button", { name: "Çeki rədd et" }));
    expect(controls.getByRole("button", { name: "Qərarı təsdiqlə" })).toBeDisabled();
    expect(stepSixApi.rejectTopUp).not.toHaveBeenCalled();
    await user.type(controls.getByRole("textbox", { name: "Səbəb" }), "Çekdə məbləğ görünmür");
    await user.click(controls.getByRole("button", { name: "Qərarı təsdiqlə" }));
    expect(stepSixApi.rejectTopUp).toHaveBeenCalledWith(21, "Çekdə məbləğ görünmür");
  });
});
