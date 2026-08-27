import { expect, test } from "@playwright/test";

test.describe("backend authentication integration", () => {
  test.skip(!process.env.RUN_BACKEND_E2E, "Requires a running turn-api instance on the configured proxy target.");

  test("registers a phone account and opens the protected area", async ({ page }, testInfo) => {
    const phone = `050${String(Date.now()).slice(-6)}${testInfo.parallelIndex % 10}`;

    await page.goto("/register");
    await page.getByLabel("Ad", { exact: true }).fill("Test");
    await page.getByLabel("Soyad", { exact: true }).fill("İstifadəçi");
    await page.getByLabel("Telefon nömrəsi", { exact: true }).fill(phone);
    await page.getByLabel("Şifrə", { exact: true }).fill("Etibarli-sifre-2026");
    await page.getByLabel("Şifrəni təkrar edin").fill("Etibarli-sifre-2026");
    const [response] = await Promise.all([
      page.waitForResponse((candidate) => candidate.url().endsWith("/api/auth/register")),
      page.getByRole("button", { name: "Hesab yarat" }).click(),
    ]);
    const responseBody = await response.text();

    expect(response.status(), responseBody).toBe(200);

    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole("button", { name: /Müştəri kimi davam et/ }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { name: /Xoş gəldiniz, Test/i })).toBeVisible();
    await expect(page.getByText("+994")).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { name: /Xoş gəldiniz, Test/i })).toBeVisible();

    await page.goto("/onboarding");
    await page.getByRole("button", { name: /Fərdi mütəxəssis/ }).click();
    await page.getByLabel("İş sahəsinin adı").fill(`Test Studio ${phone.slice(-4)}`);
    await page.getByRole("button", { name: "Fərdi sahə yarat" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByLabel("Aktiv sahə")).toHaveValue(/INDIVIDUAL:/);

    await page.goto("/onboarding");
    await page.getByRole("button", { name: /Biznes/ }).click();
    await page.getByLabel("Biznes adı").fill(`Test Biznes ${phone.slice(-4)}`);
    await page.getByRole("button", { name: "Biznes yarat" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByLabel("Aktiv sahə")).toHaveValue(/BUSINESS:/);
  });
});
