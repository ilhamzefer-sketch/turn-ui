import { expect, test, type Page } from "@playwright/test";

const user = { id: 44, firstName: "Leyla", lastName: "Məmmədova", phone: "+994501234567", status: "ACTIVE", createdAt: "2026-08-20T08:00:00" };
const plannedRoom = {
  id: 30, name: "Aysel — saç ustası", roomNumberOrCode: "A-02", description: "Saç xidməti", timezone: "Asia/Baku",
  reservationMode: "PLANNED_BOOKING", defaultSlotDurationMinutes: 30, appointmentBufferMinutes: 0, liveQueueAcceptingNewEntries: true,
  providerName: "Sakit Studio", providerDescription: null, providerLogoUrl: null, branchName: "Mərkəz", category: null, customSubcategory: null,
  location: { address: "Nizami 10", city: "Bakı", district: "Səbail", latitude: null, longitude: null }, contactPhone: "+994501112233",
  owners: [{ displayName: "Aysel Məmmədova", phone: null }], services: [{ id: 8, name: "Saç kəsimi", description: null, price: 20, currency: "AZN" }], averageRating: 0, ratingCount: 0,
};
const managedRoom = {
  id: 30, businessId: 10, branchId: 20, individualWorkspaceId: null, createdByUserId: 44, name: plannedRoom.name, roomNumberOrCode: "A-02", description: "Saç xidməti", notes: null, timezone: "Asia/Baku", reservationMode: "LIVE_QUEUE", defaultSlotDurationMinutes: 30, appointmentBufferMinutes: 0, bookingWindowDays: 30, minimumAdvanceMinutes: 30, cancellationCutoffMinutes: 120, liveQueueResetPolicy: "DAILY_AT_TIME", liveQueueResetLocalTime: "08:00:00", liveQueueResetIntervalMinutes: null, liveQueueMaxParticipants: null, liveQueueAcceptingNewEntries: true, status: "PUBLISHED", visibility: "PUBLIC", personalPublicAddress: null, personalLatitude: null, personalLongitude: null, createdAt: user.createdAt, archivedAt: null,
};
const activeBooking = { id: 90, bookingReference: "B-TEST90", roomId: 30, roomName: plannedRoom.name, serviceId: 8, serviceName: "Saç kəsimi", status: "ACTIVE", participantName: "Cavid Əlizadə", participantPhone: "+994505556677", startAt: "2026-08-24T10:00:00", endAt: "2026-08-24T10:30:00", timezone: "Asia/Baku", customerNote: null, internalNote: null, source: "WEB", cancellationReason: null, cancellationDetail: null, createdByUserId: 44, createdAt: user.createdAt, updatedAt: user.createdAt, completedAt: null, cancelledAt: null };

async function mockSession(page: Page) {
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ accessToken: "token-test" }) }));
  await page.route("**/api/users/me", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(user) }));
  await page.route("**/api/users/me/workspaces", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ type: "CUSTOMER", contextId: 44, name: "Leyla Məmmədova", role: "CUSTOMER" }, { type: "ROOM", contextId: 30, name: plannedRoom.name, role: "ROOM_OWNER" }]) }));
}

test("guest joins a public live queue and receives a private status page", async ({ page }, testInfo) => {
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "anonymous" }) }));
  await page.route("**/api/public/rooms/30/live-queue/join", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ sessionId: 7, publicReference: "Q-PRIVATE123", queuePosition: 3, status: "WAITING", peopleAhead: 2, approximateWaitingMinutes: 60, currentPublicReference: "Q-NOW", acceptingNewEntries: true }) }));
  await page.route("**/api/public/rooms/30/live-queue", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ roomId: 30, roomName: plannedRoom.name, sessionId: 7, status: "OPEN", acceptingNewEntries: true, nextOpeningAt: null, nextResetAt: "2026-08-21T08:00:00", currentPublicReference: "Q-NOW", waitingCount: 2, approximateWaitingMinutes: 60, entries: [{ publicReference: "Q-NOW", queuePosition: 1, status: "CURRENT" }] }) }));
  await page.route("**/api/public/live-queue/entries/Q-PRIVATE123", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ publicReference: "Q-PRIVATE123", status: "WAITING", peopleAhead: 2, approximateWaitingMinutes: 60, currentPublicReference: "Q-NOW", acceptingNewEntries: true }) }));
  await page.goto("/rooms/30/live");
  await page.getByLabel("Ad və soyad").fill("Cavid Əlizadə");
  await page.getByLabel("Telefon nömrəsi").fill("050 555 66 77");
  await page.getByRole("button", { name: "Qonaq kimi növbəyə qoşul" }).click();
  await expect(page).toHaveURL(/\/queue\/Q-PRIVATE123$/);
  await expect(page.getByText("Q-PRIVATE123")).toBeVisible();
  await expect(page.getByText("60 dəqiqə")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("participant-status.png"), fullPage: true });
});

test("room owner advances the current live participant", async ({ page }, testInfo) => {
  await mockSession(page);
  const session = { id: 7, roomId: 30, roomName: plannedRoom.name, serviceDate: "2026-08-20", status: "OPEN", acceptanceOverride: "AUTO", acceptingNewEntries: true, nextOpeningAt: null, nextResetAt: "2026-08-21T08:00:00", currentPublicReference: "Q-NOW", waitingCount: 1, skippedCount: 0, activeCount: 2, openedAt: user.createdAt, closedAt: null, entries: [{ id: 1, publicReference: "Q-NOW", queuePosition: 1, status: "CURRENT", source: "QR", displayName: "Cavid Əlizadə", phone: "+994505556677", linkedUserId: null, internalNote: null, createdByUserId: null, createdAt: user.createdAt, completedAt: null, removedAt: null }, { id: 2, publicReference: "Q-NEXT", queuePosition: 2, status: "WAITING", source: "WEB", displayName: "Nigar Əliyeva", phone: "+994507778899", linkedUserId: 52, internalNote: null, createdByUserId: null, createdAt: user.createdAt, completedAt: null, removedAt: null }] };
  await page.route("**/api/rooms/30", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(managedRoom) }));
  await page.route("**/api/rooms/30/live-queue", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(session) }));
  await page.route("**/api/rooms/30/live-queue/complete-current", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...session, currentPublicReference: "Q-NEXT", waitingCount: 0, entries: [{ ...session.entries[0], status: "COMPLETED", completedAt: "2026-08-20T09:00:00" }, { ...session.entries[1], status: "CURRENT" }] }) }));
  await page.goto("/app/rooms/30/today");
  await expect(page.getByRole("heading", { name: "Cavid Əlizadə" })).toBeVisible();
  await page.getByRole("button", { name: "Tamamla və növbətini çağır" }).click();
  await expect(page.getByRole("heading", { name: "Nigar Əliyeva" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("owner-live-queue.png"), fullPage: true });
});

test("registered customer books a planned slot", async ({ page }, testInfo) => {
  await mockSession(page);
  await page.route("**/api/public/rooms/30", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(plannedRoom) }));
  await page.route("**/api/public/rooms/30/available-slots?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ startAt: "2026-08-24T10:00:00", endAt: "2026-08-24T10:30:00", timezone: "Asia/Baku" }]) }));
  await page.route("**/api/bookings", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(activeBooking) }));
  await page.goto("/rooms/30/book");
  await page.getByRole("button", { name: "10:00" }).click();
  await page.getByRole("button", { name: "Rezervasiyanı təsdiqlə" }).click();
  await expect(page.getByText("B-TEST90")).toBeVisible();
  await expect(page.getByRole("heading", { name: plannedRoom.name })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("booking-success.png"), fullPage: true });
});

test("customer sees bookings and cancels with an explicit confirmation", async ({ page }) => {
  await mockSession(page);
  let booking = activeBooking;
  await page.route("**/api/users/me/bookings", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([booking]) }));
  await page.route("**/api/users/me/live-queue-history", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("**/api/bookings/90/cancel", (route) => { booking = { ...booking, status: "CANCELLED", cancellationReason: "CUSTOMER_CANCELLED", cancelledAt: "2026-08-20T10:00:00" }; return route.fulfill({ contentType: "application/json", body: JSON.stringify(booking) }); });
  await page.goto("/app/bookings");
  await page.getByRole("button", { name: "Ləğv et" }).click();
  await expect(page.getByText("Bu rezervasiyanı ləğv etmək istəyirsiniz?")).toBeVisible();
  await page.getByRole("button", { name: "Bəli, ləğv et" }).click();
  await expect(page.getByRole("heading", { name: "Aktiv rezervasiya yoxdur" })).toBeVisible();
});

test("step 5 public and operator pages have no compact horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "anonymous" }) }));
  await page.route("**/api/public/rooms/30/live-queue", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ roomId: 30, roomName: "Çox uzun adlı mütəxəssis otağı və xidmət sahəsi", sessionId: 7, status: "OPEN", acceptingNewEntries: true, nextOpeningAt: null, nextResetAt: null, currentPublicReference: "Q-VERY-LONG-REFERENCE", waitingCount: 12, approximateWaitingMinutes: 360, entries: [] }) }));
  await page.goto("/rooms/30/live");
  const width = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(width.scrollWidth).toBeLessThanOrEqual(width.clientWidth);
  await expect(page.getByRole("button", { name: "Qonaq kimi növbəyə qoşul" })).toBeVisible();
});

test("step 5 participant status remains usable with reduced motion and doubled text", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/auth/csrf**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "csrf-test" }) }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "anonymous" }) }));
  await page.route("**/api/public/live-queue/entries/Q-ACCESSIBLE", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ publicReference: "Q-ACCESSIBLE", status: "WAITING", peopleAhead: 4, approximateWaitingMinutes: 120, currentPublicReference: "Q-NOW", acceptingNewEntries: true }) }));
  await page.goto("/queue/Q-ACCESSIBLE");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

  await expect(page.getByRole("heading", { name: "Gözləyir" })).toBeVisible();
  await expect(page.getByText("Q-ACCESSIBLE")).toBeVisible();
  const width = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(width.scrollWidth).toBeLessThanOrEqual(width.clientWidth);
});
