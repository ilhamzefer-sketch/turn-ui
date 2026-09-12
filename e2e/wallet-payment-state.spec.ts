import { expect, test, type Page } from "@playwright/test";

const baseRequest = {
  id: 9, packageCode: "AZN_10", amountAzn: 10, coinAmount: 100, currency: "AZN",
  paymentUrl: null, status: "AWAITING_RECEIPT", paymentProvider: "epoint",
  externalOrderId: "wallet-9-1", checkoutState: "READY",
  clickedAt: "2026-09-12T12:00:00", receiptDeadlineAt: "2026-09-12T12:30:00",
  receiptUploadedAt: null, receiptUploadOpen: false,
};

async function walletSession(page: Page, balance = () => 0) {
  const json = (value: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(value) });
  const session = () => ({
    id: 1, serverTime: new Date().toISOString(), lastActivityAt: new Date().toISOString(),
    idleExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    absoluteExpiresAt: new Date(Date.now() + 7_200_000).toISOString(),
  });
  await page.route("**/api/auth/csrf**", (route) => route.fulfill(json({ csrfToken: "csrf-test" })));
  await page.route("**/api/auth/refresh", (route) => route.fulfill(json({ accessToken: "token-test" })));
  await page.route("**/api/auth/session", (route) => route.fulfill(json(session())));
  await page.route("**/api/auth/activity", (route) => route.fulfill(json(session())));
  await page.route("**/api/users/me", (route) => route.fulfill(json({
    id: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567",
    status: "ACTIVE", createdAt: "2026-09-12T08:00:00",
  })));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill(json([
    { type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" },
  ])));
  await page.route("**/api/users/me/wallet", (route) => route.fulfill(json({
    userId: 44, balance: balance(), updatedAt: "2026-09-12T08:00:00",
  })));
  await page.route("**/api/users/me/wallet/top-up-options", (route) => route.fulfill(json({
    coinsPerAzn: 10, minimumCoins: 1, maximumCoins: 1_000_000, currency: "AZN",
    whatsappUrl: "#", bankCardEnabled: true, manualTopUpEnabled: false,
    packages: [{ code: "AZN_5", amountAzn: 5, coinAmount: 50 }, { code: "AZN_10", amountAzn: 10, coinAmount: 100 }],
  })));
  await page.route("**/api/users/me/wallet/top-up-requests/active", (route) => route.fulfill(json({ message: "Aktiv sorğu yoxdur" }, 404)));
  await page.route("**/api/users/me/wallet/transactions**", (route) => route.fulfill(json({
    items: balance() ? [{
      id: 1, type: "TOP_UP", direction: "CREDIT", amount: 100, balanceBefore: 0,
      balanceAfter: 100, actorType: "SYSTEM", referenceKey: "top-up-request:9",
      description: "Epoint ödənişi", createdAt: "2026-09-12T12:02:00",
    }] : [], page: 0, size: 20, hasNext: false,
  })));
}

test("wallet controls stay usable on mobile with enlarged text", async ({ page }, testInfo) => {
  await walletSession(page);
  await page.goto("/app/wallet");
  await expect(page.getByRole("heading", { name: "Balansınız" })).toBeVisible();
  const five = page.getByRole("radio", { name: "5 ₼ · 50 coin" });
  await five.click();
  await expect(five).toHaveAttribute("aria-checked", "true");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await expect(page.getByRole("button", { name: "Epoint ilə ödəniş et 5 ₼" })).toBeVisible();
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  await page.screenshot({ path: testInfo.outputPath("wallet-enlarged.png"), fullPage: true });
});

test("payment return waits for authenticated paid state", async ({ page }, testInfo) => {
  let lookups = 0;
  await walletSession(page, () => lookups >= 2 ? 100 : 0);
  await page.route("**/api/users/me/wallet/top-up-requests/9", (route) => {
    lookups += 1;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({
      ...baseRequest, status: lookups < 2 ? "AWAITING_RECEIPT" : "PAID",
      receiptUploadedAt: lookups < 2 ? null : "2026-09-12T12:02:00",
    }) });
  });
  await page.goto("/app/wallet?payment=success&requestId=9");
  await expect(page.getByText("Ödəniş emal olunur")).toBeVisible();
  await expect(page.getByText("Ödəniş təsdiqləndi")).toBeVisible({ timeout: 10_000 });
  expect(lookups).toBeGreaterThanOrEqual(2);
  await expect(page.getByLabel("Cari coin balansı").getByText("100 coin")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("wallet-confirmed.png"), fullPage: true });
});

test("admin payment view groups and reviews legacy receipts", async ({ page }, testInfo) => {
  const json = (value: unknown) => ({ contentType: "application/json", body: JSON.stringify(value) });
  const item = {
    id: 21, userId: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567",
    packageCode: "AZN_5", amountAzn: 5, coinAmount: 50, currency: "AZN",
    paymentProvider: "manual", externalOrderId: null, status: "MANUAL_REVIEW",
    clickedAt: "2026-09-12T12:00:00", receiptDeadlineAt: "2026-09-12T12:30:00",
    receiptUploadedAt: "2026-09-12T12:05:00", receiptAttachmentId: 3,
    receiptMediaType: "image/png", receiptSizeBytes: 1200, confirmedFraudCount: 3,
    fraudCountAfter: null, reviewedAt: null, resolutionNote: null,
  };
  const summary = {
    total: 32, paid: 10, failed: 4, waiting: 18, paidTodayAmount: 24,
    businessDate: "2026-09-12", timezone: "Asia/Baku",
  };
  await page.route("**/api/auth/csrf**", (route) => route.fulfill(json({ csrfToken: "csrf-test" })));
  await page.route("**/api/auth/refresh", (route) => route.fulfill(json({ accessToken: "admin-token" })));
  await page.route("**/api/admin/login", (route) => route.fulfill(json({
    username: "admin", role: "ADMIN", message: "ok", accessToken: "admin-token",
  })));
  await page.route("**/api/admin/overview", (route) => route.fulfill(json({
    users: 50, activeUsers: 50, suspendedUsers: 0, businesses: 2, rooms: 3,
    activeSubscriptions: 0, graceSubscriptions: 0, suspendedSubscriptions: 0,
    completedSubscriptionPayments: 0, openOwnershipDisputes: 0, openPhoneChanges: 0,
    openDeletionRequests: 0,
  })));
  await page.route("**/api/admin/payments/top-ups?**", (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? 0);
    return route.fulfill(json({
      items: pageNumber === 0 ? [item] : [], page: pageNumber, size: 20,
      hasNext: pageNumber === 0 && !url.searchParams.get("status"), summary,
    }));
  });
  await page.route("**/api/admin/payments/top-ups/21/reject", (route) => route.fulfill(json({
    ...item, status: "REJECTED", resolutionNote: "Çekdə məbləğ görünmür",
  })));
  await page.route("**/api/admin/payments/top-ups/21/receipt", (route) => route.fulfill({
    contentType: "image/png", body: "receipt-fixture",
  }));
  await page.goto("/platform/login");
  await page.getByLabel("Admin istifadəçi adı").fill("admin");
  await page.getByLabel("Şifrə", { exact: true }).fill("secret-password");
  await page.getByRole("button", { name: "Platformaya daxil ol" }).click();
  await page.goto("/platform/payments");
  await expect(page.getByText(/24[.,]00 ₼/)).toBeVisible();
  await page.getByRole("button", { name: "Növbəti səhifə" }).click();
  await expect(page.getByText("Bu filtrdə ödəniş yoxdur.")).toBeVisible();
  await page.getByRole("button", { name: "Gözləyir" }).click();
  await expect(page.getByText("Leyla Məmmədova")).toBeVisible();
  const receiptPopup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Çeki aç" }).click();
  const popup = await receiptPopup;
  await expect(popup).toHaveURL(/^blob:/);
  await popup.close();
  await page.getByRole("button", { name: "Çeki rədd et" }).click();
  await expect(page.getByRole("button", { name: "Qərarı təsdiqlə" })).toBeDisabled();
  await page.getByRole("textbox", { name: "Səbəb" }).fill("Çekdə məbləğ görünmür");
  await page.screenshot({ path: testInfo.outputPath("admin-review.png"), fullPage: true });
  await page.getByRole("button", { name: "Qərarı təsdiqlə" }).click();
});
