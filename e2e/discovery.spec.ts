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
  await page.getByRole("link", { name: /Növbəyə qoşul/ }).click();
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
