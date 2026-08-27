import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "../../shared/api/contracts";
import { AuthContext, type AuthStatus } from "../../shared/auth/authContext";
import { PublicLayout } from "./PublicLayout";

const user: CurrentUser = {
  id: 7,
  firstName: "Camal",
  lastName: "Cavadov",
  phone: "+994501112233",
  status: "ACTIVE",
  createdAt: "2026-08-20T10:00:00",
};

function renderLayout(status: AuthStatus) {
  render(
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
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("PublicLayout", () => {
  it("shows account actions and hides login actions for an authenticated user", () => {
    renderLayout("authenticated");

    expect(screen.getAllByRole("link", { name: "Hesabım" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Çıxış et" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Daxil ol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hesab yarat" })).not.toBeInTheDocument();
  });

  it("does not flash anonymous actions while the session is being restored", () => {
    renderLayout("checking");

    expect(screen.queryByRole("link", { name: "Daxil ol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hesab yarat" })).not.toBeInTheDocument();
    expect(screen.getByText("Hesab yoxlanılır…")).toBeInTheDocument();
  });

  it("shows login and registration actions after an anonymous session is confirmed", () => {
    renderLayout("anonymous");

    expect(screen.getAllByRole("link", { name: "Daxil ol" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Hesab yarat" })).toHaveLength(2);
  });
});
