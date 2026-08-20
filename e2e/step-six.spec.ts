import { expect, test, type Page } from "@playwright/test";

const user = { id: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567", status: "ACTIVE", createdAt: "2026-08-20T08:00:00" };
const workspaces = [{ type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" }, { type: "BUSINESS", contextId: 10, name: "Sakit Studio", role: "PRIMARY_OWNER" }, { type: "ROOM", contextId: 30, name: "Aysel — saç ustası", role: "ROOM_OWNER" }];

async function session(page: Page) {
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ accessToken: "token-test" }) }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspaces) }));
}

test("business owner reviews operational analytics and downloads Excel", async ({ page }, testInfo) => {
  await session(page);
  await page.route("**/api/businesses/10/analytics?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ from: "2026-07-22", to: "2026-08-20", totalPeople: 42, liveQueueEntries: 30, plannedBookings: 12, completed: 35, cancelled: 3, skipped: 2, removed: 1, reset: 1, guestParticipants: 25, registeredParticipants: 17, averageEstimatedWaitMinutes: 18, maximumEstimatedWaitMinutes: 50, busiestDay: "WEDNESDAY", busiestHour: 11, rooms: [{ roomId: 30, roomName: "Aysel — saç ustası", branchId: 20, branchName: "Mərkəz", liveEntries: 30, plannedBookings: 12, completed: 35, cancelled: 3, skipped: 2, removed: 1, reset: 1, guestParticipants: 25, registeredParticipants: 17, estimatedCapacityMinutes: 1050 }] }) }));
  await page.route("**/api/businesses/10/analytics.xlsx?**", (route) => route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: "xlsx-test" }));
  await page.goto("/app/businesses/10/analytics");
  await expect(page.getByRole("heading", { name: "İş yükünü aydın görün" })).toBeVisible();
  await expect(page.getByLabel("Əsas göstəricilər").getByText("42", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("business-analytics.png"), fullPage: true });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Excel hesabatını endir" }).click();
  await expect((await download).suggestedFilename()).toBe("business-10-operations.xlsx");
});

test("provider sees transparent subscription plans and starts checkout", async ({ page }) => {
  await session(page);
  await page.route("**/api/subscriptions/plans", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ id: 1, code: "STANDARD_MONTHLY", name: "Standard Monthly", billingPeriod: "MONTHLY", amount: 20, currency: "AZN", roomLimit: 100, employeeLimit: 500 }]) }));
  await page.route("**/api/subscriptions/current?**", (route) => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Abunəlik tapılmadı" }) }));
  await page.route("**/api/subscriptions/receipts?**", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/subscriptions/checkout", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 5, status: "PENDING", provider: "MOCK", paymentMode: "TEST", amount: 20, currency: "AZN", paymentReference: "PAY-5", checkoutUrl: null, subscription: null, createdAt: "2026-08-20T08:00:00", completedAt: null }) }));
  await page.goto("/app/businesses/10/subscription");
  await expect(page.getByText("20", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Bu planı seç" }).click();
  await expect(page.getByRole("button", { name: "Bu planı seç" })).toBeEnabled();
});

test("customer creates a manual phone-change support request", async ({ page }) => {
  await session(page);
  await page.route("**/api/support/phone-change-requests", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 88, userId: 44, currentPhone: user.phone, requestedPhone: "+994507778899", reason: "Nömrə dəyişib", status: "OPEN", resolutionNote: null, createdAt: user.createdAt, resolvedAt: null }) }));
  await page.goto("/app/support");
  await page.getByLabel("Yeni telefon nömrəsi").fill("050 777 88 99");
  await page.getByLabel("Dəyişiklik səbəbi").fill("Nömrə dəyişib");
  await page.getByRole("button", { name: "Telefon dəyişikliyi göndər" }).click();
  await expect(page.getByText("Müraciət #88 qəbul edildi")).toBeVisible();
});

test("platform admin logs in and reviews support overview", async ({ page }) => {
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/admin/login", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ username: "admin", role: "ADMIN", message: "ok", accessToken: "admin-token" }) }));
  await page.route("**/api/admin/overview", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ users: 120, activeUsers: 115, suspendedUsers: 5, businesses: 12, rooms: 31, activeSubscriptions: 10, graceSubscriptions: 1, suspendedSubscriptions: 1, completedSubscriptionPayments: 24, openOwnershipDisputes: 2, openPhoneChanges: 3, openDeletionRequests: 1 }) }));
  await page.route("**/api/admin/support/ownership-disputes", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/admin/support/phone-change-requests", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/admin/support/account-deletion-requests", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.goto("/platform/login");
  await page.getByLabel("Admin istifadəçi adı").fill("admin");
  await page.getByLabel("Şifrə").fill("secret-password");
  await page.getByRole("button", { name: "Platformaya daxil ol" }).click();
  await expect(page).toHaveURL(/\/platform$/);
  await expect(page.getByRole("heading", { name: "Platformanın ümumi vəziyyəti" })).toBeVisible();
  await expect(page.getByText("120", { exact: true })).toBeVisible();
});

test("step 6 analytics reflows with doubled text and reduced motion", async ({ page }) => {
  await session(page); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/rooms/30/analytics?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ from: "2026-07-22", to: "2026-08-20", totalPeople: 0, liveQueueEntries: 0, plannedBookings: 0, completed: 0, cancelled: 0, skipped: 0, removed: 0, reset: 0, guestParticipants: 0, registeredParticipants: 0, averageEstimatedWaitMinutes: 0, maximumEstimatedWaitMinutes: 0, busiestDay: null, busiestHour: null, rooms: [] }) }));
  await page.goto("/app/rooms/30/analytics");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await expect(page.getByRole("heading", { name: "İş yükünü aydın görün" })).toBeVisible();
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")].filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((element) => ({ tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 40), right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })).slice(0, 8),
  }));
  expect(size.scroll, JSON.stringify(size.offenders)).toBeLessThanOrEqual(size.client);
});
