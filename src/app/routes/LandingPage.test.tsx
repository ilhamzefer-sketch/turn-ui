import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../shared/auth/authContext";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("presents one clear proposition and two factual product modes", () => {
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

    expect(screen.getByRole("heading", { level: 1, name: /Növbəni deyil/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Canlı növbə" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Planlı rezervasiya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Otaq tap/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Otaq axtarışı" })).toBeInTheDocument();
  });
});
