import { expect, test, type Page } from "@playwright/test";

const user = {
  id: 44,
  firstName: "Leyla",
  lastName: "Məmmədova",
  phone: "+994501234567",
  status: "ACTIVE",
  createdAt: "2026-08-18T10:00:00",
};

async function mockAuthenticatedOnboarding(page: Page) {
  let individualCreated = false;

  await page.route("**/api/auth/csrf", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ csrfToken: "test-csrf" }),
  }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ accessToken: "test-access-token" }),
  }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/api/public/categories", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([
      { id: 2, code: "BEAUTY", name: "Gözəllik" },
      { id: 9, code: "OTHER", name: "Digər" },
    ]),
  }));
  await page.route("**/api/users/me/invitations", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ businessInvitations: [], roomInvitations: [] }),
  }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([
      { type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" },
      ...(individualCreated
        ? [{ type: "INDIVIDUAL", contextId: 12, name: "Leyla Studio", role: "OWNER" }]
        : []),
    ]),
  }));
  await page.route("**/api/individual-workspaces", async (route) => {
    individualCreated = true;
    await route.fulfill({
      contentType: "application/json",
      status: 201,
      body: JSON.stringify({
        id: 12,
        ownerUserId: 44,
        name: "Leyla Studio",
        timezone: "Asia/Baku",
        status: "ACTIVE",
        createdAt: "2026-08-18T10:10:00",
        archivedAt: null,
      }),
    });
  });
}

test.beforeEach(async ({ page }) => mockAuthenticatedOnboarding(page));

test("creates an individual workspace and selects it", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "NövbəTime-dan necə istifadə edəcəksiniz?" })).toBeVisible();

  await page.getByRole("button", { name: /Fərdi mütəxəssis/ }).click();
  await page.getByLabel("İş sahəsinin adı").fill("Leyla Studio");
  await page.getByRole("button", { name: "Fərdi sahə yarat" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByLabel("Aktiv sahə")).toHaveValue("INDIVIDUAL:12");
  await expect(page.getByText("Leyla Studio aktivdir.")).toBeVisible();
});

test("onboarding remains usable on a compact touch viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/onboarding");

  const widthState = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  await expect(page.getByRole("button", { name: /Müştəri kimi davam et/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Biznes/ })).toBeVisible();
});

test("onboarding keeps keyboard focus and survives enlarged text", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "The desktop project covers enlarged browser text.");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "NövbəTime-dan necə istifadə edəcəksiniz?" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByText("Əsas məzmuna keç", { exact: true })).toBeFocused();
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

  const widthState = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  await expect(page.getByRole("button", { name: /Müştəri kimi davam et/ })).toBeVisible();
});

test("manual account recovery explains the support flow and preserves a reference", async ({ page }) => {
  await page.route("**/api/support/ownership-disputes", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      id: 91,
      disputedUserId: 44,
      disputedPhone: "+994501234567",
      claimantName: "Leyla Məmmədova",
      claimantContactPhone: "+994501234567",
      description: "Şifrəmi unutmuşam və hesabı bərpa etmək istəyirəm.",
      status: "OPEN",
      resolutionAction: "NO_ACTION",
      resolutionNote: null,
      reviewedByAdmin: null,
      createdAt: "2026-08-18T10:20:00",
      resolvedAt: null,
    }),
  }));

  await page.goto("/account-recovery");
  await page.getByLabel("Hesabın telefon nömrəsi").fill("050 123 45 67");
  await page.getByLabel("Ad və soyad").fill("Leyla Məmmədova");
  await page.getByLabel("Sizinlə əlaqə üçün telefon").fill("050 123 45 67");
  await page.getByLabel("Müraciətin izahı").fill("Şifrəmi unutmuşam və hesabı bərpa etmək istəyirəm.");
  await page.getByRole("button", { name: "Müraciəti göndər" }).click();

  await expect(page.getByRole("heading", { name: /Dəstək komandası/ })).toBeVisible();
  await expect(page.getByText("#91")).toBeVisible();
});
