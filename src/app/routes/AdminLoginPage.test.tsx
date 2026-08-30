import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { AdminLoginPage } from "./AdminLoginPage";

vi.mock("../../shared/meta/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("../../shared/api/stepSixApi", () => ({ stepSixApi: { adminLogin: vi.fn() } }));

describe("AdminLoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes a bootstrap admin to the mandatory credential change", async () => {
    vi.mocked(stepSixApi.adminLogin).mockResolvedValue({
      username: "admin",
      role: "ADMIN",
      message: "Daxil oldunuz.",
      mustChangeCredentials: true,
      accessToken: "bootstrap-token",
    });
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/platform/login"]}><Routes>
      <Route path="/platform/login" element={<AdminLoginPage />} />
      <Route path="/platform/ilk-giris" element={<h1>Məcburi dəyişiklik</h1>} />
    </Routes></MemoryRouter></QueryClientProvider>);

    await user.type(screen.getByLabelText("Admin istifadəçi adı"), "admin");
    await user.type(screen.getByLabelText("Şifrə"), "Admin2026!");
    await user.click(screen.getByRole("button", { name: "Platformaya daxil ol" }));
    expect(await screen.findByRole("heading", { name: "Məcburi dəyişiklik" })).toBeInTheDocument();
  });
});
