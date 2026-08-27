import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ActionableErrorDialog } from "./ActionableErrorDialog";

describe("ActionableErrorDialog", () => {
  it("shows the error and a direct recovery link in a non-blocking alert", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <input aria-label="Arxa plandakı sahə" autoFocus />
        <ActionableErrorDialog
          title="Otaq yaradıla bilmədi"
          message="Aktiv abunəlik tələb olunur."
          action={{ label: "Abunəliyə keç", to: "/app/individual/7/subscription" }}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert", { name: "Otaq yaradıla bilmədi" })).toBeInTheDocument();
    expect(screen.getByText("Aktiv abunəlik tələb olunur.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abunəliyə keç" })).toHaveAttribute("href", "/app/individual/7/subscription");
    expect(screen.getByRole("textbox", { name: "Arxa plandakı sahə" })).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Bildirişi bağla" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses an assertive alert without stealing focus when there is no recovery link", () => {
    render(
      <MemoryRouter>
        <ActionableErrorDialog
          title="Əməliyyat tamamlanmadı"
          message="Yenidən cəhd edin."
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert", { name: "Əməliyyat tamamlanmadı" })).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("button", { name: "Bildirişi bağla" })).not.toHaveFocus();
  });
});
