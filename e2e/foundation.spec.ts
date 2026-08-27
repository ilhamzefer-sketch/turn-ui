import { expect, test } from "@playwright/test";

test("landing page has a complete keyboard-visible first journey", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nə etmək istəyirsiniz?");
  const favicon = page.locator('link[rel="icon"]');
  await expect(favicon).toHaveAttribute("href", "/favicon-96x96.png");
  await expect(favicon).toHaveAttribute("sizes", "96x96");
  const faviconResponse = await page.request.get("/favicon-96x96.png");
  expect(faviconResponse.ok()).toBeTruthy();
  expect(faviconResponse.headers()["content-type"]).toContain("image/png");
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
  await expect(page.getByRole("link", { name: "Hesab yarat" })).toHaveCount(0);
  const workspaceLinks = page.getByRole("link", { name: "İş sahəsinə keçin" });
  await expect(workspaceLinks).toHaveCount(2);
  await expect(workspaceLinks.first()).toBeVisible();
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
  await expect(page.getByRole("link", { name: /Növbə yarat/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();
  await expect(page.getByLabel("Menyunu aç")).toBeVisible();
});

test("registration Tab order skips subdued field info controls", async ({ page }) => {
  await page.goto("/register");

  const firstName = page.getByLabel("Ad", { exact: true });
  const lastName = page.getByLabel("Soyad", { exact: true });
  const infoControls = page.getByRole("button", { name: "Sahə haqqında məlumatı göstər" });
  await expect(infoControls.first()).toHaveAttribute("tabindex", "-1");

  await firstName.focus();
  await page.keyboard.press("Tab");
  await expect(lastName).toBeFocused();

  const infoStyle = await infoControls.first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: Number.parseFloat(style.width), opacity: Number.parseFloat(style.opacity), fontSize: Number.parseFloat(style.fontSize) };
  });
  expect(infoStyle.width).toBeLessThanOrEqual(24);
  expect(infoStyle.opacity).toBeLessThan(0.7);
  expect(infoStyle.fontSize).toBeLessThan(12);
});

test("reduced motion keeps the page understandable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Canlı növbə", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planlı rezervasiya" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Növbə yarat/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();

  const modeCard = page.getByRole("heading", { name: "Canlı növbə", exact: true }).locator("xpath=ancestor::article");
  await modeCard.hover();
  await expect.poll(() => modeCard.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("landing detail cards share a restrained desktop hover treatment", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "Hover treatment is intentionally limited to fine pointers.");
  await page.goto("/");

  const modeCard = page.getByRole("heading", { name: "Canlı növbə", exact: true }).locator("xpath=ancestor::article");
  await modeCard.hover();
  await expect.poll(() => modeCard.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeLessThan(-1);

  const businessMedia = page.locator(".landing-business__media");
  const businessImage = businessMedia.locator(":scope > img");
  await businessMedia.hover();
  await expect.poll(() => businessImage.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeGreaterThan(1.005);

  const sectorCard = page.getByRole("heading", { name: "Klinika və tibbi qəbul" }).locator("xpath=ancestor::article");
  await sectorCard.hover();
  await expect.poll(() => sectorCard.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeLessThan(-1);
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
  await expect(page.getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();
});
