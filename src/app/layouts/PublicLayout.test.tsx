import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "../../shared/api/contracts";
import { AuthContext, type AuthStatus } from "../../shared/auth/authContext";
import { ProtectedRoute } from "../../shared/auth/ProtectedRoute";
import { PublicLayout } from "./PublicLayout";

const user: CurrentUser = {
  id: 7,
  firstName: "Camal",
  lastName: "Cavadov",
  phone: "+994501112233",
  status: "ACTIVE",
  createdAt: "2026-08-20T10:00:00",
};

function layout(status: AuthStatus) {
  return (
    <AuthContext.Provider value={{
      status,
      user: status === "authenticated" ? user : null,
      login: vi.fn(),
      register: vi.fn(),
      restore: vi.fn(),
      logout: vi.fn(),
    }}>
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<p>Ana səhifə</p>} />
            <Route path="/login" element={<p>Giriş səhifəsi</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

function renderLayout(status: AuthStatus) {
  return render(layout(status));
}

describe("PublicLayout", () => {
  it("closes mobile navigation and starts the new page at the top", async () => {
    const user = userEvent.setup();
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { container } = renderLayout("anonymous");
    const menu = container.querySelector<HTMLDetailsElement>(".mobile-menu")!;
    menu.open = true;
    await user.click(menu.querySelector<HTMLAnchorElement>('a[href="/login"]')!);
    expect(await screen.findByText("Giriş səhifəsi")).toBeInTheDocument();
    expect(menu.open).toBe(false);
    expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    scroll.mockRestore();
  });
  it("shows account actions and hides login actions for an authenticated user", () => {
    renderLayout("authenticated");

    expect(screen.getAllByRole("link", { name: "Hesabım" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Çıxış et" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Daxil ol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hesab yarat" })).not.toBeInTheDocument();
  });

  it.each(["idle", "checking"] as const)("shows usable public actions immediately while auth is %s", (status) => {
    const { container } = renderLayout(status);

    expect(screen.getAllByRole("link", { name: "Daxil ol" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Hesab yarat" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Daxil ol" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Hesab yarat" })[0]).toHaveAttribute("href", "/register");
    expect(container.querySelector(".auth-link-placeholder, .auth-button-placeholder")).toBeNull();
    expect(screen.getByText("Ana səhifə")).toBeInTheDocument();
  });

  it("replaces public actions when a restored account is confirmed", () => {
    const { rerender } = renderLayout("checking");

    rerender(layout("authenticated"));

    expect(screen.getAllByRole("link", { name: "Hesabım" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Daxil ol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hesab yarat" })).not.toBeInTheDocument();
  });

  it("shows login and registration actions after an anonymous session is confirmed", () => {
    renderLayout("anonymous");

    expect(screen.getAllByRole("link", { name: "Daxil ol" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Hesab yarat" })).toHaveLength(2);
  });

  it("still withholds private content until the session is confirmed", () => {
    render(
      <AuthContext.Provider value={{ status: "checking", user: null, login: vi.fn(), register: vi.fn(), restore: vi.fn(), logout: vi.fn() }}>
        <MemoryRouter initialEntries={["/app"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<p>Private account data</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText("Private account data")).not.toBeInTheDocument();
    expect(screen.getByText("Hesabınız yoxlanılır")).toBeInTheDocument();
  });
});
