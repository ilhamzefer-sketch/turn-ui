import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
});

test("vertical scrolling moves the gallery both ways and can be skipped", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop scroll narrative.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const section = page.locator(".landing-gallery");
  const rail = page.locator(".landing-gallery__rail");
  await expect(section).toHaveClass(/landing-gallery--pinned/);
  const start = await section.evaluate((element) => window.scrollY + element.getBoundingClientRect().top);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start);
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeLessThan(2);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 900);
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(890);
  await expect.poll(() => page.locator(".landing-gallery__sticky").evaluate((element) => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(2);
  await page.screenshot({ path: testInfo.outputPath("gallery-desktop.png") });
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start + 200);
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeLessThan(210);
  await rail.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".landing-gallery__count")).toContainText("04 / 04");
  await expect(page.getByRole("button", { name: "Növbəti şəkil", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: /Qalereyadan sonra/ }).click();
  await expect.poll(() => page.locator("#landing-faq").evaluate((element) => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(5);
  await expect(page.locator("#landing-faq")).toBeFocused();
});

test("compact gallery supports buttons, keyboard and native horizontal scrolling", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const section = page.locator(".landing-gallery");
  const rail = page.locator(".landing-gallery__rail");
  await expect(section).not.toHaveClass(/landing-gallery--pinned/);
  await section.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Növbəti şəkil", exact: true }).click();
  await expect(page.locator(".landing-gallery__count")).toContainText("02 / 04");
  await rail.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".landing-gallery__count")).toContainText("04 / 04");
  await page.keyboard.press("Home");
  await expect(page.locator(".landing-gallery__count")).toContainText("01 / 04");
  await rail.evaluate((element) => element.scrollTo({ left: 345, behavior: "instant" }));
  await expect(page.locator(".landing-gallery__count")).toContainText("02 / 04");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("gallery-mobile.png") });
});

test("motion preference changes reveal every image in a static layout", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const section = page.locator(".landing-gallery");
  await expect(section).not.toHaveClass(/landing-gallery--pinned/);
  await expect(page.locator(".landing-gallery__rail")).toHaveCSS("display", "grid");
  await expect(page.locator(".landing-gallery__controls")).toBeHidden();
  for (const img of await section.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await section.screenshot({ path: testInfo.outputPath("gallery-reduced-motion.png") });
});
