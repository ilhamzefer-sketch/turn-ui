import { render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { level: 1, name: "Nə etmək istəyirsiniz?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Növbə yarat/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /Növbəyə qoşul/i })).toHaveAttribute("href", "/rooms");
    expect(screen.getByText("Davam etmək üçün hesab tələb olunur")).toBeInTheDocument();
    expect(screen.getByText("Planlı qəbul üçün giriş tələb olunur")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Canlı növbə" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Planlı rezervasiya" })).toBeInTheDocument();
  });
});
