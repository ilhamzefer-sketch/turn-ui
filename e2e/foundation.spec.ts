import { expect, test } from "@playwright/test";

test("landing page has a complete keyboard-visible first journey", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Növbəni deyil");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Əsas məzmuna keç", { exact: true })).toBeFocused();

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByLabel("Menyunu aç").click();
    await page.locator(".mobile-menu nav").getByRole("link", { name: "Daxil ol", exact: true }).click();
  } else {
    await page.locator(".desktop-nav").getByRole("link", { name: "Daxil ol", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Hesabınıza daxil olun" })).toBeVisible();
});

test("authenticated landing replaces account creation actions with the current account", async ({ page }, testInfo) => {
  await page.route("**/api/auth/csrf", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ csrfToken: "landing-csrf" }),
  }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ accessToken: "landing-access" }),
  }));
  await page.route("**/api/users/me", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      id: 21,
      firstName: "Camal",
      lastName: "Cavadov",
      phone: "+994501112233",
      status: "ACTIVE",
      createdAt: "2026-08-20T10:00:00",
    }),
  }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ type: "CUSTOMER", contextId: 21, name: "Camal Cavadov", role: "CUSTOMER" }]),
  }));

  await page.goto("/");

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByLabel("Menyunu aç").click();
    await expect(page.locator(".mobile-menu nav").getByRole("link", { name: "Hesabım" })).toBeVisible();
  } else {
    await expect(page.locator(".desktop-nav").getByRole("link", { name: "Hesabım" })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Daxil ol" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pulsuz hesab yarat" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Hesabıma keç" })).toBeVisible();
});

test("compact layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  const widthState = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Menyunu aç")).toBeVisible();
});

test("reduced motion keeps the page understandable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Canlı növbə", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planlı rezervasiya" })).toBeVisible();
});

test("content survives 200 percent text sizing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "The wide reflow scenario covers browser text enlargement.");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

  const widthState = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Otaq tap" })).toBeVisible();
});
