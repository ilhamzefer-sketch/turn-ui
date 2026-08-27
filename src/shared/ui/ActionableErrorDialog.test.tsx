import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ActionableErrorDialog } from "./ActionableErrorDialog";

describe("ActionableErrorDialog", () => {
  it("shows the error and a direct recovery link in an accessible dialog", async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <ActionableErrorDialog
          title="Otaq yaradıla bilmədi"
          message="Aktiv abunəlik tələb olunur."
          action={{ label: "Abunəliyə keç", to: "/app/individual/7/subscription" }}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alertdialog", { name: "Otaq yaradıla bilmədi" })).toBeInTheDocument();
    expect(screen.getByText("Aktiv abunəlik tələb olunur.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abunəliyə keç" })).toHaveAttribute("href", "/app/individual/7/subscription");
    await waitFor(() => expect(screen.getByRole("link", { name: "Abunəliyə keç" })).toHaveFocus());

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("focuses the close action when there is no recovery link", async () => {
    render(
      <MemoryRouter>
        <ActionableErrorDialog
          title="Əməliyyat tamamlanmadı"
          message="Yenidən cəhd edin."
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Bağla" })).toHaveFocus());
  });
});
