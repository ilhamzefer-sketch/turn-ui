import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("TextField password visibility", () => {
  it("shows and hides a password with an accessible toggle", async () => {
    const user = userEvent.setup();
    render(<TextField label="Şifrə" type="password" />);

    const field = screen.getByLabelText("Şifrə");
    const toggle = screen.getByRole("button", { name: "Şifrəni göstər və ya gizlət" });

    expect(field).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);

    expect(field).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);

    expect(field).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("does not add a visibility toggle to ordinary text fields", () => {
    render(<TextField label="Ad" />);

    expect(screen.queryByRole("button", { name: "Şifrəni göstər və ya gizlət" })).not.toBeInTheDocument();
  });
});
