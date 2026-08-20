import { expect, test, type Page } from "@playwright/test";

const user = {
  id: 44,
  firstName: "Leyla",
  lastName: "Məmmədova",
  phone: "+994501234567",
  status: "ACTIVE",
  createdAt: "2026-08-18T10:00:00",
};

const business = {
  id: 10,
  primaryOwnerUserId: 44,
  name: "Sakit Studio",
  legalName: null,
  description: "Gözəllik və qulluq xidmətləri",
  taxId: null,
  logoUrl: null,
  phone: "+994501112233",
  timezone: "Asia/Baku",
  status: "ACTIVE",
  createdAt: "2026-08-18T10:00:00",
  archivedAt: null,
  category: { id: 2, code: "BEAUTY", name: "Gözəllik" },
  customSubcategory: null,
};

const room = {
  id: 30,
  businessId: 10,
  branchId: 20,
  individualWorkspaceId: null,
  createdByUserId: 44,
  name: "Aysel — saç ustası",
  roomNumberOrCode: "A-02",
  description: "Saç kəsimi və rəngləmə",
  notes: null,
  timezone: "Asia/Baku",
  reservationMode: "PLANNED_BOOKING",
  defaultSlotDurationMinutes: 30,
  appointmentBufferMinutes: 10,
  bookingWindowDays: 30,
  minimumAdvanceMinutes: 60,
  cancellationCutoffMinutes: 120,
  liveQueueResetPolicy: null,
  liveQueueResetLocalTime: null,
  liveQueueResetIntervalMinutes: null,
  liveQueueMaxParticipants: null,
  liveQueueAcceptingNewEntries: true,
  status: "DRAFT",
  visibility: "UNLISTED",
  personalPublicAddress: null,
  personalLatitude: null,
  personalLongitude: null,
  createdAt: "2026-08-18T10:20:00",
  archivedAt: null,
};

const individualWorkspace = {
  id: 11,
  ownerUserId: 44,
  name: "Leylanın fərdi sahəsi",
  timezone: "Asia/Baku",
  status: "ACTIVE",
  createdAt: "2026-08-18T10:00:00",
  archivedAt: null,
};

const individualRoom = {
  ...room,
  id: 31,
  businessId: null,
  branchId: null,
  individualWorkspaceId: 11,
  name: "Leyla Məmmədova",
  roomNumberOrCode: null,
  description: "Fərdi qəbul və konsultasiya",
  personalPublicAddress: "Nizami küçəsi 12, Bakı",
};

async function mockManagement(page: Page) {
  let activeIndividualRoom: typeof individualRoom | null = individualRoom;
  const branches = [{
    id: 20,
    businessId: 10,
    name: "Mərkəz filialı",
    address: "Nizami küçəsi 10",
    city: "Bakı",
    district: "Səbail",
    latitude: null,
    longitude: null,
    phone: null,
    effectivePhone: "+994501112233",
    notes: null,
    timezone: "Asia/Baku",
    status: "ACTIVE",
    createdAt: "2026-08-18T10:10:00",
    archivedAt: null,
  }];

  await page.route("**/api/auth/csrf", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "test-csrf" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ accessToken: "test-token" }) }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([
      { type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" },
      { type: "INDIVIDUAL", contextId: 11, name: individualWorkspace.name, role: "OWNER" },
      { type: "BUSINESS", contextId: 10, name: "Sakit Studio", role: "PRIMARY_OWNER" },
      { type: "ROOM", contextId: 30, name: "Aysel — saç ustası", role: "ROOM_OWNER" },
    ]),
  }));
  await page.route("**/api/public/categories", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([business.category]) }));
  await page.route("**/api/businesses/10", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(business) }));
  await page.route("**/api/businesses/10/branches", async (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      const created = { ...branches[0], ...payload, id: 21, effectivePhone: payload.phone || business.phone };
      branches.push(created);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(created) });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(branches) });
  });
  await page.route("**/api/businesses/10/rooms", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([room]) }));
  await page.route("**/api/businesses/10/members", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, businessId: 10, businessName: business.name, userId: 44, firstName: "Leyla", lastName: "Məmmədova", phone: user.phone, role: "PRIMARY_OWNER", status: "ACTIVE", invitedByUserId: 44, invitedFirstName: "Leyla", invitedLastName: "Məmmədova", invitedAt: user.createdAt, acceptedAt: user.createdAt }]),
  }));
  await page.route("**/api/individual-workspaces/11", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(individualWorkspace) }));
  await page.route("**/api/individual-workspaces/11/rooms", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(activeIndividualRoom ? [activeIndividualRoom] : []),
  }));
  await page.route("**/api/rooms/31", async (route) => {
    if (route.request().method() === "DELETE") {
      activeIndividualRoom = null;
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(individualRoom) });
  });
  await page.route("**/api/rooms/30", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(room) }));
  await page.route("**/api/rooms/30/assignments", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 50, roomId: 30, roomName: room.name, userId: 44, firstName: "Leyla", lastName: "Məmmədova", phone: user.phone, role: "ROOM_OWNER", status: "ACTIVE", showPhonePublicly: false, invitedByUserId: 44, invitedAt: user.createdAt, respondedAt: user.createdAt }]),
  }));
  await page.route("**/api/rooms/30/availability-rules", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, roomId: 30, dayOfWeek: "MONDAY", startTime: "09:00:00", endTime: "18:00:00", active: true }]),
  }));
  await page.route("**/api/rooms/30/availability-exceptions", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/rooms/30/services", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/rooms/30/qr-codes", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 80, roomId: 30, type: "PERMANENT_ROOM", active: true, token: "permanent-test-token", createdAt: user.createdAt, revokedAt: null }]),
  }));
}

test.beforeEach(async ({ page }) => mockManagement(page));

test("business workspace presents the setup sequence and management navigation", async ({ page }, testInfo) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await expect(page).toHaveURL(/\/app\/businesses\/10$/);
  await expect(page.getByRole("heading", { name: "Sakit Studio" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "İş sahəsinin bölmələri" })).toContainText("Filiallar");
  await expect(page.getByText("Biznesi işə hazırlayın")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("business-overview.png"), fullPage: true });
});

test("creates a branch without losing entered management context", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await page.getByRole("link", { name: "Filiallar", exact: true }).click();
  await page.getByRole("button", { name: "Yeni filial" }).click();
  await page.getByLabel("Filial adı").fill("Gənclik filialı");
  await page.getByLabel("Şəhər").fill("Bakı");
  await page.getByLabel("Rayon").fill("Nərimanov");
  await page.getByLabel("Tam ünvan").fill("Atatürk prospekti 12");
  await page.getByRole("button", { name: "Filial yarat" }).click();
  await expect(page.getByRole("heading", { name: "Gənclik filialı" })).toBeVisible();
  await expect(page.getByText("Gənclik filialı yaradıldı.")).toBeVisible();
});

test("room management remains usable on a compact viewport and exposes permanent QR", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("ROOM:30");
  await expect(page).toHaveURL(/\/app\/rooms\/30$/);
  await expect(page.getByRole("heading", { name: room.name })).toBeVisible();
  await page.getByRole("link", { name: "QR kodlar" }).click();
  await expect(page.getByRole("heading", { name: "QR kodlar" })).toBeVisible();
  await expect(page.getByText(/permanent-test-token/)).toBeVisible();
  const widthState = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  const skipLinkBottom = await page.locator(".skip-link").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(skipLinkBottom).toBeLessThanOrEqual(0);
  await page.screenshot({ path: testInfo.outputPath("room-qr-compact.png"), fullPage: true });
});

test("individual workspace shows its room and returns to creation after deletion", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("INDIVIDUAL:11");

  await expect(page).toHaveURL(/\/app\/individual\/11$/);
  await expect(page.getByRole("heading", { name: individualRoom.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Redaktə et" })).toHaveAttribute("href", "/app/rooms/31");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Otağı sil" }).click();

  await expect(page.getByRole("heading", { name: "Otağınızı yaradın" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Otağı sil" })).toHaveCount(0);
});

test("management navigation and actions survive doubled text", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "The wide reflow scenario covers enlarged browser text.");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await expect(page.getByRole("heading", { name: "Sakit Studio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Filiallar", exact: true })).toBeVisible();
  const widthState = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
});
