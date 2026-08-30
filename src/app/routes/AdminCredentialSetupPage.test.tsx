import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { AdminCredentialSetupPage } from "./AdminCredentialSetupPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/stepSixApi", () => ({
  stepSixApi: { adminChangeRequiredCredentials: vi.fn() },
}));

describe("AdminCredentialSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stepSixApi.adminChangeRequiredCredentials).mockResolvedValue({
      username: "owner.admin",
      role: "ADMIN",
      message: "Admin giriş məlumatları yeniləndi.",
      mustChangeCredentials: false,
      accessToken: "new-admin-token",
    });
  });

  it("requires new credentials and opens the platform after a successful change", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/platform/ilk-giris"]}><Routes>
      <Route path="/platform/ilk-giris" element={<AdminCredentialSetupPage />} />
      <Route path="/platform" element={<h1>Platform açıldı</h1>} />
    </Routes></MemoryRouter></QueryClientProvider>);

    expect(screen.getByText("Bu addımı keçmək mümkün deyil.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Müvəqqəti şifrə"), "Admin2026!");
    await user.type(screen.getByLabelText("Yeni admin istifadəçi adı"), "owner.admin");
    await user.type(screen.getByLabelText("Yeni admin şifrəsi"), "SecureAdmin2026!");
    await user.type(screen.getByLabelText("Yeni şifrəni təkrarla"), "SecureAdmin2026!");
    await user.click(screen.getByRole("button", { name: "Məlumatları dəyiş və panelə keç" }));

    expect(await screen.findByRole("heading", { name: "Platform açıldı" })).toBeInTheDocument();
    expect(stepSixApi.adminChangeRequiredCredentials).toHaveBeenCalledWith(
      "Admin2026!",
      "owner.admin",
      "SecureAdmin2026!",
    );
  });

  it("does not allow the bootstrap username to be reused", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><AdminCredentialSetupPage /></MemoryRouter></QueryClientProvider>);
    await user.type(screen.getByLabelText("Yeni admin istifadəçi adı"), "admin");
    expect(screen.getByRole("alert")).toHaveTextContent("standart admin adından fərqli");
    expect(screen.getByRole("button", { name: "Məlumatları dəyiş və panelə keç" })).toBeDisabled();
  });
});
