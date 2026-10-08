import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
});

test("landing page has a complete keyboard-visible first journey", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Daha az gözləyin.");
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
  await page.route(/\/api\/auth\/(session|activity)$/, (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ id: 1, serverTime: new Date().toISOString(), lastActivityAt: new Date().toISOString(), idleExpiresAt: new Date(Date.now() + 1_800_000).toISOString(), absoluteExpiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
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
  const workspaceLinks = page.getByRole("link", { name: "İş sahəsinə keçin", exact: true });
  await expect(workspaceLinks.first()).toHaveAttribute("href", "/app");
  await expect(workspaceLinks.first()).toBeVisible();
  await page.getByRole("tab", { name: "Biznes sahibi", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Biznes sahibi" }).getByRole("link", { name: "Növbə yarat", exact: true })).toHaveAttribute("href", "/app");
});

test("role tabs switch with the keyboard and preserve customer and account routes", async ({ page }) => {
  await page.goto("/");
  const customer = page.getByRole("tab", { name: "Müştəri", exact: true });
  await customer.focus();
  await page.keyboard.press("ArrowRight");
  const employee = page.getByRole("tab", { name: "Əməkdaş", exact: true });
  await expect(employee).toBeFocused();
  await expect(employee).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Əməkdaş" }).getByRole("link", { name: "İş sahəsinə keçin", exact: true })).toHaveAttribute("href", "/register");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Biznes sahibi", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Biznes sahibi" }).getByRole("link", { name: "Növbə yarat", exact: true })).toHaveAttribute("href", "/register");
  await page.keyboard.press("Home");
  await expect(customer).toBeFocused();
  await page.keyboard.press("Tab");
  const join = page.getByRole("tabpanel", { name: "Müştəri" }).getByRole("link", { name: "Növbəyə qoşul", exact: true });
  await expect(join).toBeFocused();
  await expect(join).toHaveAttribute("href", "/rooms");
  await expect(page).toHaveURL(/\/$/);
});

test("scroll moves product visuals and a live reduced-motion preference restores a static page", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const mobile = testInfo.project.name === "mobile-chromium";
  const visual = mobile ? page.getByRole("tabpanel", { name: "Müştəri" }).locator(".qless-role__scene") : page.locator(".qless-floating--two");
  const initialY = await visual.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
  const targetScroll = mobile ? await page.locator(".qless-roles").evaluate((element) => window.scrollY + element.getBoundingClientRect().top + 200) : 300;
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), targetScroll);
  await expect.poll(() => visual.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeLessThan(initialY - 0.5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => visual.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
  for (const section of await page.locator(".landing-page > section").all()) {
    const heading = section.locator("h1, h2").first();
    if (await heading.count()) {
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS("opacity", "1");
    }
  }
});

test("320px public landing keeps its content within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  for (const section of await page.locator(".landing-page > section").all()) {
    await section.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  }
  await page.getByRole("tab", { name: "Biznes sahibi", exact: true }).click();
  await page.getByRole("button", { name: "Növbəti imkan", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
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
  await expect(page.locator(".qless-hero").getByRole("link", { name: /Növbə yarat/ })).toBeVisible();
  await expect(page.locator(".qless-hero").getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();
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
  expect(infoStyle.width).toBeLessThanOrEqual(32);
  expect(infoStyle.opacity).toBeLessThan(0.7);
  expect(infoStyle.fontSize).toBeLessThan(12);
});

test("reduced motion keeps the page understandable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  for (const title of ["Gözləmək yerinə gününüzü yaşayın.", "Qəbul vaxtı sizə uyğun olsun.", "Hər otaq bir baxışda.", "Komandanız vahid axında."]) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Növbəti imkan" })).toHaveCount(0);
  await expect(page.locator(".qless-hero").getByRole("link", { name: /Növbə yarat/ })).toBeVisible();
  await expect(page.locator(".qless-hero").getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();
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
  await expect(page.locator(".qless-hero").getByRole("link", { name: /Növbəyə qoşul/ })).toBeVisible();
});

test("benefits support manual controls on compact layouts and scroll on desktop", async ({ page }, testInfo) => {
  const desktop = testInfo.project.name === "chromium";
  await page.setViewportSize(desktop ? { width: 1440, height: 900 } : { width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const benefits = page.locator("#product-benefits");
  if (desktop) {
    await expect(benefits).toHaveClass(/qless-benefits--pinned/);
    const start = await benefits.evaluate((element) => window.scrollY + element.getBoundingClientRect().top);
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 900);
    await expect(benefits.getByRole("heading", { name: "Qəbul vaxtı sizə uyğun olsun.", exact: true })).toBeVisible();
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 2700);
    await expect(benefits.getByRole("heading", { name: "Komandanız vahid axında.", exact: true })).toBeVisible();
  } else {
    await benefits.getByRole("button", { name: "Növbəti imkan", exact: true }).click();
    await expect(benefits.getByRole("heading", { name: "Qəbul vaxtı sizə uyğun olsun.", exact: true })).toBeVisible();
    await benefits.getByRole("region", { name: "Platformanın imkanları" }).focus();
    await page.keyboard.press("End");
    await expect(benefits.getByRole("heading", { name: "Komandanız vahid axında.", exact: true })).toBeVisible();
  }
  await expect(benefits.getByRole("button", { name: "Növbəti imkan", exact: true })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(benefits).not.toHaveClass(/qless-benefits--pinned/);
  await expect(benefits.getByRole("heading", { level: 2 })).toHaveCount(4);
});

test("generated landing imagery loads and provides desktop and mobile preview artifacts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Both screenshot sizes are captured in one desktop browser run.");
  for (const viewport of [{ width: 1440, height: 1000, path: "/tmp/novbe-qless-desktop.png" }, { width: 390, height: 844, path: "/tmp/novbe-qless-mobile.png" }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator(".qless-hero__avatars").evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy();
    await page.screenshot({ path: viewport.path });
    if (viewport.width === 1440) {
      await page.getByRole("tab", { name: "Əməkdaş", exact: true }).click();
      await expect.poll(() => page.getByRole("tabpanel", { name: "Əməkdaş" }).evaluate((element) => Math.abs(element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2 - window.innerWidth / 2))).toBeLessThan(2);
      await page.locator(".qless-roles").screenshot({ path: "/tmp/novbe-qless-roles.png" });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const img of await page.locator(".landing-page img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
});


test("benefit scenes blend continuously with scroll and reverse cleanly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop pinned scene blending.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const benefits = page.locator("#product-benefits");
  await expect(benefits).toHaveClass(/qless-benefits--pinned/);
  const start = await benefits.evaluate((element) => window.scrollY + element.getBoundingClientRect().top);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 720);
  const visuals = benefits.locator(".qless-benefits__visual");
  await expect.poll(() => visuals.nth(1).evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.15);
  const outgoing = await visuals.nth(0).evaluate((element) => Number(getComputedStyle(element).opacity));
  expect(outgoing).toBeGreaterThan(0);
  expect(outgoing).toBeLessThan(1);
  expect(await visuals.nth(1).evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await page.screenshot({ path: "/tmp/novbe-benefits-transition.png" });
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 2700);
  await expect(benefits.getByRole("heading", { name: "Komandanız vahid axında.", exact: true })).toBeVisible();
  await expect.poll(() => visuals.nth(3).evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.99);
  await expect(benefits.locator('.qless-benefits__chapters button[aria-current="step"] span')).toHaveCSS("background-color", "rgb(17, 97, 88)");
  await page.screenshot({ path: "/tmp/novbe-benefits-smooth.png" });
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start);
  await expect.poll(() => visuals.nth(0).evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.99);
  await expect(benefits.getByRole("heading", { name: "Gözləmək yerinə gününüzü yaşayın.", exact: true })).toBeVisible();
});
