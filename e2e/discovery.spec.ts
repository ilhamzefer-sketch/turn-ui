import { expect, test, type Page } from "@playwright/test";

const roomSummary = {
  id: 7,
  name: "Leyla ilə saç baxımı",
  description: "Saç kəsimi və gündəlik baxım.",
  reservationMode: "PLANNED_BOOKING",
  providerName: "Sahil Studio",
  branchName: "Mərkəz filialı",
  category: { id: 2, code: "BEAUTY", name: "Gözəllik" },
  customSubcategory: null,
  location: { address: "Nizami küçəsi 10", city: "Bakı", district: "Səbail", latitude: null, longitude: null },
  averageRating: 4.8,
  ratingCount: 12,
};

async function mockDiscovery(page: Page) {
  await page.route("**/api/public/categories", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 2, code: "BEAUTY", name: "Gözəllik" }]),
  }));
  await page.route(/.*\/api\/public\/rooms(?:\?.*)?$/, (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ items: [roomSummary], page: 0, size: 12, totalElements: 1, totalPages: 1 }),
  }));
  await page.route("**/api/public/rooms/7", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      ...roomSummary,
      roomNumberOrCode: "B-14",
      timezone: "Asia/Baku",
      defaultSlotDurationMinutes: 30,
      appointmentBufferMinutes: 0,
      liveQueueAcceptingNewEntries: false,
      providerDescription: "Səbaildə fərdi qulluq studiyası.",
      providerLogoUrl: null,
      contactPhone: "+994501112233",
      owners: [{ displayName: "Leyla Məmmədova", phone: null }],
    }),
  }));
  await page.route("**/api/public/rooms/7/available-slots?date=*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([
      { startAt: "2026-08-18T10:00:00", endAt: "2026-08-18T10:30:00", timezone: "Asia/Baku" },
      { startAt: "2026-08-18T10:30:00", endAt: "2026-08-18T11:00:00", timezone: "Asia/Baku" },
    ]),
  }));
}

test.beforeEach(async ({ page }) => mockDiscovery(page));

test("landing quick join opens filtered discovery and a complete room profile", async ({ page }) => {
  await page.goto("/");
  await page.locator(".qless-hero").getByRole("link", { name: /Növbəyə qoşul/ }).click();
  await expect(page).toHaveURL(/\/rooms$/);

  const search = page.getByRole("form", { name: "Axtarış filterləri" });
  await search.getByLabel("Axtarış").fill("saç");
  await search.getByLabel("Planlı rezervasiya").check();
  await search.getByRole("button", { name: "Nəticələri göstər" }).click();

  await expect(page).toHaveURL(/\/rooms\?q=sa%C3%A7&mode=PLANNED_BOOKING/);
  await expect(page.getByRole("heading", { name: "Leyla ilə saç baxımı" })).toBeVisible();
  await page.getByRole("link", { name: /Profili aç/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Leyla ilə saç baxımı" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bu gün üçün boş saatlar" })).toBeVisible();
  await expect(page.getByText("10:00")).toBeVisible();
});

test("discovery stays usable at compact width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/rooms");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Uyğun otağı");
  await expect(page.getByRole("heading", { name: "Leyla ilə saç baxımı" })).toBeVisible();

  const widthState = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
});

test("room profile contains long names and addresses inside padded cards", async ({ page }) => {
  const longName = "Mütəxəssis".repeat(18);
  await page.route("**/api/public/rooms/7", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      ...roomSummary,
      name: longName,
      providerName: longName,
      branchName: null,
      location: { ...roomSummary.location, address: "Uzunünvan".repeat(22) },
      roomNumberOrCode: "B-14",
      timezone: "Asia/Baku",
      defaultSlotDurationMinutes: 30,
      appointmentBufferMinutes: 0,
      providerDescription: "Müştərilər üçün fərdi qəbul və xidmət.",
      providerLogoUrl: null,
      contactPhone: "+994501112233",
      owners: [{ displayName: longName, phone: null }],
    }),
  }));

  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/rooms/7");
    await expect(page.getByRole("heading", { level: 1, name: longName })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vaxt seç və rezervasiya et" })).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cards: Array.from(document.querySelectorAll<HTMLElement>(".profile-section, .availability-card")).map((card) => ({
        width: card.clientWidth,
        contentWidth: card.scrollWidth,
        padding: Number.parseFloat(getComputedStyle(card).paddingLeft),
        headingContained: Array.from(card.querySelectorAll("h2, h3")).every((heading) => {
          const child = heading.getBoundingClientRect();
          const parent = card.getBoundingClientRect();
          return child.left >= parent.left && child.right <= parent.right;
        }),
      })),
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.width);
    for (const card of layout.cards) {
      expect(card.contentWidth).toBeLessThanOrEqual(card.width);
      expect(card.padding).toBeGreaterThanOrEqual(16);
      expect(card.headingContained).toBe(true);
    }
  }
});

test("signed-in room visitors see management navigation on desktop and mobile", async ({ page }) => {
  const now = new Date().toISOString();
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ accessToken: "token-test" }) }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567", status: "ACTIVE", createdAt: now }) }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([
    { type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" },
    { type: "BUSINESS", contextId: 10, name: "Sahil Studio", role: "PRIMARY_OWNER" },
  ]) }));
  await page.route("**/api/auth/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: 1, serverTime: now, lastActivityAt: now, idleExpiresAt: new Date(Date.now() + 7200000).toISOString(), absoluteExpiresAt: new Date(Date.now() + 86400000).toISOString() }) }));

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/rooms/7");
    const header = page.locator(".site-header");
    if (width < 1200) await header.getByLabel("Menyunu aç").click();
    const navigation = header.getByRole("navigation", { name: width < 1200 ? "Mobil naviqasiya" : "Əsas naviqasiya" });
    await expect(navigation.getByRole("link", { name: "İdarəetmə" })).toHaveAttribute("href", "/app/businesses/10");
    await expect(navigation.getByRole("link", { name: "Növbələrim" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Hesabım" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Biznes üçün", exact: true })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Kimlər üçün", exact: true })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Daxil ol", exact: true })).toHaveCount(0);
    expect(await header.evaluate((el) => el.scrollWidth <= innerWidth)).toBe(true);
  }
});
