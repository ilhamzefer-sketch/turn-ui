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
  description: "Gözəllik və qulluq mərkəzi",
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
  await page.route("**/api/auth/session", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      id: 1,
      serverTime: "2026-08-18T10:00:00+04:00",
      lastActivityAt: "2026-08-18T10:00:00+04:00",
      idleExpiresAt: "2026-08-18T18:00:00+04:00",
      absoluteExpiresAt: "2026-08-18T22:00:00+04:00",
    }),
  }));
  await page.route("**/api/auth/activity", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      id: 1,
      serverTime: "2026-08-18T10:00:00+04:00",
      lastActivityAt: "2026-08-18T10:00:00+04:00",
      idleExpiresAt: "2026-08-18T18:00:00+04:00",
      absoluteExpiresAt: "2026-08-18T22:00:00+04:00",
    }),
  }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/api/users/me/invitations", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ businessInvitations: [], roomInvitations: [] }),
  }));
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
  await page.route("**/api/rooms/30/availability-rules", async (route) => {
    if (route.request().method() === "PUT") {
      const payload = route.request().postDataJSON() as { rules: Array<Record<string, unknown>> };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(payload.rules.map((rule, index) => ({ ...rule, id: index + 1, roomId: 30 }))),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, roomId: 30, dayOfWeek: "MONDAY", startTime: "09:00:00", endTime: "18:00:00", active: true }]),
    });
  });
  await page.route("**/api/rooms/30/availability-exceptions", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/rooms/30/qr-codes", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 80, roomId: 30, type: "PERMANENT_ROOM", active: true, token: "permanent-test-token", createdAt: user.createdAt, revokedAt: null }]),
  }));
}

test.beforeEach(async ({ page }) => mockManagement(page));

test("business workspace presents the setup sequence and management navigation", async ({ page }, testInfo) => {
  await page.goto("/app");
  await expect(page.locator(".account-summary div").filter({ hasText: "İdarə olunan iş sahələri" })).toContainText("3");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await expect(page).toHaveURL(/\/app\/businesses\/10$/);
  await expect(page.getByRole("heading", { name: "Sakit Studio" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "İş sahəsinin bölmələri" })).toContainText("Filiallar");
  await expect(page.getByText("Biznesi işə hazırlayın")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("business-overview.png"), fullPage: true });
});

test("active workspace remains selected after a full page refresh", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await expect(page).toHaveURL(/\/app\/businesses\/10$/);

  await page.goto("/app");
  await expect(page.getByLabel("Aktiv sahə")).toHaveValue("BUSINESS:10");
  await page.reload();

  await expect(page.getByLabel("Aktiv sahə")).toHaveValue("BUSINESS:10");
  await expect(page.getByText("Sakit Studio aktivdir.")).toBeVisible();
});

test("creates a branch without losing entered management context", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("BUSINESS:10");
  await page.getByRole("link", { name: "Filiallar", exact: true }).click();
  await page.getByRole("button", { name: "Yeni filial" }).click();
  await page.getByRole("textbox", { name: "Filial adı", exact: true }).fill("Gənclik filialı");
  await page.getByRole("textbox", { name: "Şəhər", exact: true }).fill("Bakı");
  await page.getByRole("textbox", { name: "Rayon", exact: true }).fill("Nərimanov");
  await page.getByRole("textbox", { name: "Tam ünvan", exact: true }).fill("Atatürk prospekti 12");
  await page.getByRole("button", { name: "Filial yarat" }).click();
  await expect(page.getByRole("heading", { name: "Gənclik filialı" })).toBeVisible();
  await expect(page.getByText("Gənclik filialı yaradıldı.")).toBeVisible();
});

test("room management remains usable on a compact viewport and exposes permanent QR", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("ROOM:30");
  await expect(page).toHaveURL(/\/app\/rooms\/30\/settings/);
  await expect(page.getByRole("heading", { name: room.name })).toBeVisible();
  await expect(page.getByRole("heading", { name: "QR kodlar" })).toBeVisible();
  await expect(page.getByRole("img", { name: `${room.name} üçün QR kod 1` })).toBeVisible();
  await expect(page.getByRole("button", { name: "Arxivləşdir" })).toHaveCount(0);
  const widthState = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.clientWidth);
  const skipLinkBottom = await page.locator(".skip-link").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(skipLinkBottom).toBeLessThanOrEqual(0);
  await page.screenshot({ path: testInfo.outputPath("room-qr-compact.png"), fullPage: true });
});

test("publish error opens an actionable popup with the correct recovery page", async ({ page }, testInfo) => {
  await page.route("**/api/rooms/30/publish", (route) => route.fulfill({
    status: 402,
    contentType: "application/json",
    body: JSON.stringify({
      status: 402,
      error: "Payment Required",
      code: "REQUEST_REJECTED",
      message: "Aktiv abunəlik tələb olunur.",
      path: "/api/rooms/30/publish",
    }),
  }));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app/rooms/30/settings?step=qr");

  await page.getByRole("button", { name: "Otağı yarat" }).click();

  const popup = page.getByRole("alert", { name: "Otaq yaradıla bilmədi" });
  await expect(popup).toBeVisible();
  await expect(popup).toContainText("Aktiv abunəlik tələb olunur.");
  await expect(popup.getByRole("link", { name: "Abunəliyə keç" })).toHaveAttribute("href", "/app/businesses/10/subscription");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  const popupBox = await popup.boundingBox();
  expect(Math.round(popupBox?.width ?? 0)).toBeLessThanOrEqual(336);
  await page.screenshot({ path: testInfo.outputPath("actionable-error-popup-mobile.png"), fullPage: true });
});

test("reset policy error links to and focuses the exact room setting", async ({ page }) => {
  const liveRoom = {
    ...room,
    reservationMode: "LIVE_QUEUE",
    status: "PUBLISHED",
    liveQueueResetPolicy: null,
  };
  await page.route("**/api/rooms/30", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          status: 400,
          error: "Bad Request",
          code: "VALIDATION_FAILED",
          message: "Canlı növbə otağı üçün reset qaydası seçilməlidir.",
          path: "/api/rooms/30",
        }),
      });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(liveRoom) });
  });
  await page.goto("/app/rooms/30/settings?section=overview");

  await page.getByRole("button", { name: "Əsas məlumatları saxla" }).click();

  const popup = page.getByRole("alert", { name: "Əməliyyat tamamlanmadı" });
  const recoveryLink = popup.getByRole("link", { name: "Sıfırlama ayarına keç" });
  await expect(recoveryLink).toHaveAttribute("href", "/app/rooms/30/settings?section=schedule#live-queue-reset-policy");
  await recoveryLink.click();

  await expect(page).toHaveURL(/\/app\/rooms\/30\/settings\?section=schedule#live-queue-reset-policy$/);
  await expect(page.getByLabel("Növbənin sıfırlanma qaydası")).toBeFocused();
});

test("individual workspace shows its room and returns to creation after deletion", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Aktiv sahə").selectOption("INDIVIDUAL:11");

  await expect(page).toHaveURL(/\/app\/individual\/11$/);
  await expect(page.getByRole("heading", { name: individualRoom.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Otaq ayarları" })).toHaveAttribute("href", "/app/rooms/31/settings");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Otağı sil" }).click();

  await expect(page.getByRole("heading", { name: "Otağınızı yaradın" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Otağı sil" })).toHaveCount(0);
});

test("edited weekend schedule is submitted and confirmed as saved", async ({ page }) => {
  await page.goto("/app/rooms/30/settings?step=schedule");
  await page.getByRole("group", { name: "Şənbə", exact: true }).getByRole("checkbox").check();
  await page.getByRole("group", { name: "Bazar", exact: true }).getByRole("checkbox").check();
  await expect(page.getByText("Saxlanmamış dəyişikliklər var")).toBeVisible();

  const requestPromise = page.waitForRequest((request) => (
    request.url().endsWith("/api/rooms/30/availability-rules") && request.method() === "PUT"
  ));
  await page.getByRole("button", { name: "Dəyişiklikləri saxla" }).click();
  const request = await requestPromise;
  const rules = (request.postDataJSON() as { rules: Array<{ dayOfWeek: string }> }).rules;

  expect(rules.map((rule) => rule.dayOfWeek)).toEqual(expect.arrayContaining(["SATURDAY", "SUNDAY"]));
  const confirmationPopup = page.getByRole("status", { name: "Əməliyyat tamamlandı" });
  await expect(confirmationPopup).toBeVisible();
  await expect(confirmationPopup).toContainText("Həftəlik iş qrafiki saxlanıldı.");
  await expect(page.locator(".success-alert, .form-alert")).toHaveCount(0);
  await confirmationPopup.getByRole("button", { name: "Bildirişi bağla" }).click();
  await expect(page.getByText("Qrafik serverlə eynidir")).toBeVisible();
});

test("live queue setup cannot continue until reset rule and time are filled", async ({ page }) => {
  const liveRoomWithoutReset = {
    ...room,
    reservationMode: "LIVE_QUEUE",
    liveQueueResetPolicy: null,
    liveQueueResetLocalTime: null,
    liveQueueResetIntervalMinutes: null,
  };
  let configurationRequests = 0;
  await page.route("**/api/rooms/30", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(liveRoomWithoutReset) }));
  await page.route("**/api/rooms/30/configuration", (route) => {
    configurationRequests += 1;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(liveRoomWithoutReset) });
  });
  await page.goto("/app/rooms/30/settings?step=schedule");

  await page.getByRole("button", { name: "Davam et" }).click();

  await expect(page).toHaveURL(/\?step=schedule$/);
  await expect(page.getByRole("alert", { name: "Əməliyyat tamamlanmadı" })).toContainText("sıfırlanma qaydasını və uyğun vaxtı doldurun");
  await expect(page.getByText("Növbənin sıfırlanma qaydasını seçin.")).toBeVisible();
  await expect(page.getByLabel("Növbənin sıfırlanma qaydası")).toBeFocused();
  expect(configurationRequests).toBe(0);
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
