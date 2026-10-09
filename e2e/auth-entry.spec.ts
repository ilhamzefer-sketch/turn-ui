import { expect, test } from "@playwright/test";

for (const path of ["/login", "/register"]) {
  for (const slowStep of ["csrf", "refresh"]) {
    test(`${path} form remains usable while ${slowStep} session check is pending`, async ({ page }) => {
      let release!: () => void;
      const pending = new Promise<void>((resolve) => { release = resolve; });
      await page.route("**/api/auth/csrf", async (route) => {
        if (slowStep === "csrf") await pending;
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ csrfToken: "entry-csrf" }) }).catch(() => undefined);
      });
      await page.route("**/api/auth/refresh", async (route) => {
        if (slowStep === "refresh") await pending;
        await route.fulfill({ status: 401, contentType: "application/json", body: "{}" }).catch(() => undefined);
      });
      try {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: path === "/login" ? "Hesabınıza daxil olun" : "NövbəTime-a qoşulun" })).toBeVisible({ timeout: 2000 });
        await page.getByLabel("Telefon nömrəsi").fill("0501112233");
        await expect(page.getByText("Hesabınız yoxlanılır", { exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: path === "/login" ? "Daxil ol" : "Hesab yarat", exact: true })).toBeEnabled();
      } finally {
        release();
      }
    });
  }
}

test("protected account pages still wait for authentication", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/auth/csrf", async (route) => {
    await pending;
    await route.fulfill({ status: 401, contentType: "application/json", body: "{}" }).catch(() => undefined);
  });
  try {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Hesabınız yoxlanılır", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Xoş gəldiniz/ })).toHaveCount(0);
  } finally {
    release();
  }
});
