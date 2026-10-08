import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../shared/auth/authContext";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("presents two immediate actions without changing their authentication rules", () => {
    render(
      <AuthContext.Provider value={{
        status: "anonymous",
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        restore: vi.fn(),
        logout: vi.fn(),
      }}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Daha az gözləyin. Daha çox yaşayın." })).toBeInTheDocument();
    const hero = within(screen.getByRole("region", { name: "Daha az gözləyin. Daha çox yaşayın." }));
    expect(hero.getByRole("link", { name: /Növbə yarat/i })).toHaveAttribute("href", "/register");
    expect(hero.getByRole("link", { name: /Növbəyə qoşul/i })).toHaveAttribute("href", "/rooms");
    expect(hero.getByText("Canlı növbəyə qeydiyyatsız qoşulmaq mümkündür.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Müştəri" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tabpanel", { name: "Müştəri" })).getByRole("link", { name: "Növbəyə qoşul" })).toHaveAttribute("href", "/rooms");
  });
});
